import { SlashCommandBuilder, EmbedBuilder, ChannelType } from 'discord.js';
import Problem from '../../models/Problem.js';
import User from '../../models/User.js';
import { logger } from '../../config/discordClient.js';
import { createOrFindUserThread, sendThreadMessage } from '../../utils/discordUtils.js';
import { hintAgent } from '../agent/hintAgent.js';

// Configuration - you can move this to a config file
const HINTS_CHANNEL_ID = process.env.HINTS_CHANNEL_ID || null;

export default {
  data: new SlashCommandBuilder()
    .setName('hint')
    .setDescription('Get hints for a specific problem in your private thread')
    .addStringOption(option =>
      option.setName('problem')
        .setDescription('Problem name or LeetCode problem number')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('level')
        .setDescription('Hint level (1-3, where 1 is subtle and 3 is more direct)')
        .setMinValue(1)
        .setMaxValue(3)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const problemQuery = interaction.options.getString('problem');
      const hintLevel = interaction.options.getInteger('level') || 1;
      const user = interaction.user;

      // Get or create hints channel
      let hintsChannel;
      if (HINTS_CHANNEL_ID) {
        hintsChannel = interaction.guild.channels.cache.get(HINTS_CHANNEL_ID);
      } else {
        // Look for a channel named "hints" or similar
        hintsChannel = interaction.guild.channels.cache.find(
          channel => 
            channel.type === ChannelType.GuildText && 
            (channel.name.includes('hint') || channel.name.includes('help'))
        );
      }

      if (!hintsChannel) {
        await interaction.editReply({
          content: '❌ **Error:** Hints channel not found. Please contact an administrator to set up a hints channel.',
        });
        return;
      }

      // Find the problem in database
      const problem = await findProblem(problemQuery);
      if (!problem) {
        await interaction.editReply({
          content: `❌ **Problem not found:** "${problemQuery}"\n\n💡 **Tips:**\n• Try using the exact problem title\n• Use LeetCode problem number (e.g., "1")\n• Check spelling and try different variations`,
        });
        return;
      }

      // Create or find user's thread
      const thread = await createOrFindUserThread(hintsChannel, user, 'Hints');
      if (!thread) {
        await interaction.editReply({
          content: '❌ **Error:** Failed to create or access your hints thread. Please try again.',
        });
        return;
      }

      // Generate AI-powered hint based on level
      const aiHintResult = await hintAgent.generateHint(problem, hintLevel, {
        previousAttempts: await getUserPreviousHints(user.id, problem._id),
        strugglingAreas: await getUserStrugglingAreas(user.id)
      });

      logger.info(`Hint generation result for ${user.username}: success=${aiHintResult.success}, fallback=${aiHintResult.fallback}`);
      
      const hint = aiHintResult.hint;
      const isAIGenerated = aiHintResult.success;

      // Validate hint structure
      if (!hint || typeof hint !== 'object') {
        logger.error('Invalid hint object received:', hint);
        await interaction.editReply({
          content: '❌ **Error:** Failed to generate hint. Please try again.',
        });
        return;
      }

      // Validate hint text
      const hintText = (hint.text && typeof hint.text === 'string' && hint.text.trim().length > 0) 
        ? hint.text.trim() 
        : 'Sorry, I couldn\'t generate a hint for this problem right now. Please try again or ask for help in the general chat.';

      logger.info(`Final hint text length: ${hintText.length}`);

      // Create hint embed with AI-generated content
      const hintEmbed = new EmbedBuilder()
        .setColor(isAIGenerated ? 0x4CAF50 : 0xffd700) // Green for AI, gold for fallback
        .setTitle(`${isAIGenerated ? '🤖' : '💡'} AI Hint Level ${hintLevel}: ${problem.title}`)
        .setDescription(hintText)
        .addFields([
          {
            name: '📊 Problem Info',
            value: `**Difficulty:** ${problem.difficulty}\n**Topics:** ${problem.topicTags?.slice(0, 3).join(', ') || 'General'}`,
            inline: false
          }
        ])
        .setFooter({ 
          text: `${isAIGenerated ? '🤖 AI-Generated' : '💡 Fallback'} Hint ${hintLevel}/3 • Use /hint with level 1-3 for different depths${aiHintResult.fallback ? ' (AI unavailable)' : ''}`,
          iconURL: user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      // Add AI-generated approach suggestion for level 2+
      if (hintLevel >= 2 && hint.approach && hint.approach.trim().length > 0) {
        hintEmbed.addFields([{
          name: '🎯 Approach Suggestion',
          value: hint.approach.trim(),
          inline: false
        }]);
      }

      // Add key insights for level 3
      if (hintLevel === 3 && hint.keyInsights && hint.keyInsights.trim().length > 0) {
        hintEmbed.addFields([{
          name: '🔑 Key Insights',
          value: hint.keyInsights.trim(),
          inline: false
        }]);
      }

      // Add complexity targets for level 3
      if (hintLevel === 3 && hint.complexity && hint.complexity.trim().length > 0) {
        hintEmbed.addFields([{
          name: '⏱️ Target Complexity',
          value: hint.complexity.trim(),
          inline: true
        }]);
      }

      // Add follow-up suggestion if available
      if (hint.followUp && hint.followUp.trim().length > 0) {
        hintEmbed.addFields([{
          name: '🔄 Next Steps',
          value: hint.followUp.trim(),
          inline: false
        }]);
      }

      // Send hint to thread
      await sendThreadMessage(thread, { embeds: [hintEmbed] });

      // Update user record with AI hint metadata
      await updateUserHintUsage(user.id, problem._id, {
        level: hintLevel,
        aiGenerated: isAIGenerated,
        fallback: aiHintResult.fallback || false
      });

      // Reply to user with thread link and AI status
      const statusEmoji = isAIGenerated ? '🤖' : '💡';
      const statusText = isAIGenerated ? 'AI-powered hint' : 'Fallback hint';
      
      await interaction.editReply({
        content: `${statusEmoji} **${statusText} sent!** Check your private thread: ${thread.toString()}\n\n🔒 **Private:** Only you and moderators can see this thread.\n⏰ **Auto-archive:** Thread will close after 24 hours of inactivity.${aiHintResult.fallback ? '\n⚠️ **Note:** AI service temporarily unavailable, using fallback hint.' : ''}`,
      });

      logger.info(`${isAIGenerated ? 'AI' : 'Fallback'} hint provided to ${user.username} for problem: ${problem.title}`);

    } catch (error) {
      logger.error('Error in hint command:', error);
      await interaction.editReply({
        content: '❌ **Error:** Something went wrong while processing your hint request. Please try again later.',
      });
    }
  },
};

/**
 * Find a problem by various search criteria
 * @param {string} query - Search query (title, number, etc.)
 * @returns {Promise<Object|null>} - Problem object or null
 */
async function findProblem(query) {
  try {
    // Try to find by exact title match first
    let problem = await Problem.findOne({
      title: { $regex: new RegExp(`^${query}$`, 'i') }
    });

    if (problem) return problem;

    // Try to find by partial title match
    problem = await Problem.findOne({
      title: { $regex: new RegExp(query, 'i') }
    });

    if (problem) return problem;

    // Try to find by LeetCode problem number
    const numberMatch = query.match(/\d+/);
    if (numberMatch) {
      problem = await Problem.findOne({
        leetcodeId: parseInt(numberMatch[0])
      });
    }

    return problem;
  } catch (error) {
    logger.error('Error finding problem:', error);
    return null;
  }
}

/**
 * Get user's previous hints for context
 * @param {string} discordId - User's Discord ID
 * @param {string} problemId - Problem's database ID
 * @returns {Promise<number>} - Number of previous hints for this problem
 */
async function getUserPreviousHints(discordId, problemId) {
  try {
    const user = await User.findOne({ discordId });
    if (!user || !user.stats || !user.stats.problemsWithHints) {
      return 0;
    }
    
    // Count how many times this problem appears in their hints history
    return user.stats.problemsWithHints.filter(id => id.toString() === problemId.toString()).length;
  } catch (error) {
    logger.error('Error getting user previous hints:', error);
    return 0;
  }
}

/**
 * Get user's struggling areas for context
 * @param {string} discordId - User's Discord ID
 * @returns {Promise<string|null>} - Description of struggling areas
 */
async function getUserStrugglingAreas(discordId) {
  try {
    const user = await User.findOne({ discordId });
    if (!user || !user.stats) {
      return null;
    }

    // Simple heuristic based on user stats
    const strugglingAreas = [];
    
    if (user.stats.hintsRequested > user.stats.problemsSolved * 2) {
      strugglingAreas.push('problem-solving approach');
    }
    
    if (user.currentStreak < 3) {
      strugglingAreas.push('consistency');
    }
    
    return strugglingAreas.length > 0 ? strugglingAreas.join(', ') : null;
  } catch (error) {
    logger.error('Error getting user struggling areas:', error);
    return null;
  }
}

/**
 * Update user's hint usage statistics with AI metadata
 * @param {string} discordId - User's Discord ID
 * @param {string} problemId - Problem's database ID
 * @param {Object} hintMetadata - Additional metadata about the hint
 */
async function updateUserHintUsage(discordId, problemId, hintMetadata = {}) {
  try {
    const updateData = {
      $inc: { 'stats.hintsRequested': 1 },
      $addToSet: { 'stats.problemsWithHints': problemId },
      $set: { lastActivity: new Date() }
    };

    // Track AI usage statistics
    if (hintMetadata.aiGenerated) {
      updateData.$inc['stats.aiHintsUsed'] = 1;
    }
    
    if (hintMetadata.fallback) {
      updateData.$inc['stats.fallbackHintsUsed'] = 1;
    }

    await User.findOneAndUpdate(
      { discordId },
      updateData,
      { upsert: true }
    );
  } catch (error) {
    logger.error('Error updating user hint usage:', error);
  }
}