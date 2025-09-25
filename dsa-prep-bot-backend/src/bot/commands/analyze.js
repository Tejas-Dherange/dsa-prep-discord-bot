import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Problem from '../../models/Problem.js';
import User from '../../models/User.js';
import { logger } from '../../config/discordClient.js';
import { getUserActiveThread, sendThreadMessage } from '../../utils/discordUtils.js';
import { hintAgent } from '../agent/hintAgent.js';

export default {
  data: new SlashCommandBuilder()
    .setName('analyze')
    .setDescription('Get AI analysis of your solution attempt with targeted hints')
    .addStringOption(option =>
      option.setName('problem')
        .setDescription('Problem name or number you\'re working on')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('code')
        .setDescription('Your attempted solution (paste your code here)')
        .setRequired(true)
        .setMaxLength(1500)
    )
    .addStringOption(option =>
      option.setName('issue')
        .setDescription('What specific issue are you facing? (e.g., "getting wrong answer", "time limit exceeded")')
        .setRequired(true)
        .setMaxLength(300)
    )
    .addStringOption(option =>
      option.setName('language')
        .setDescription('Programming language')
        .addChoices(
          { name: 'Python', value: 'python' },
          { name: 'JavaScript', value: 'javascript' },
          { name: 'Java', value: 'java' },
          { name: 'C++', value: 'cpp' },
          { name: 'C', value: 'c' },
          { name: 'Go', value: 'go' },
          { name: 'Rust', value: 'rust' },
          { name: 'Other', value: 'other' }
        )
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const problemQuery = interaction.options.getString('problem');
      const userCode = interaction.options.getString('code');
      const issue = interaction.options.getString('issue');
      const language = interaction.options.getString('language') || 'python';
      const user = interaction.user;

      // Find the problem in database
      const problem = await findProblem(problemQuery);
      if (!problem) {
        await interaction.editReply({
          content: `❌ **Problem not found:** "${problemQuery}"\n\n💡 **Tips:**\n• Try using the exact problem title\n• Use LeetCode problem number\n• Check spelling and try different variations`,
        });
        return;
      }

      // Find user's hints thread
      const hintsChannelId = process.env.HINTS_CHANNEL_ID;
      let hintsChannel;

      if (hintsChannelId) {
        hintsChannel = interaction.guild.channels.cache.get(hintsChannelId);
      } else {
        hintsChannel = interaction.guild.channels.cache.find(
          channel => channel.name.includes('hint') || channel.name.includes('help')
        );
      }

      if (!hintsChannel) {
        await interaction.editReply({
          content: '❌ **Error:** Hints channel not found. Please contact an administrator.',
        });
        return;
      }

      // Get or find user's thread (don't create new one, use existing hints thread)
      const activeThread = await getUserActiveThread(hintsChannel, user, 'Hints');
      
      if (!activeThread) {
        await interaction.editReply({
          content: '❌ **No hints thread found!** Please use `/hint [problem]` first to create your thread, then use this command.',
        });
        return;
      }

      // Generate AI code analysis with targeted hints
      const analysisResult = await hintAgent.analyzeAndHint(
        problem,
        userCode,
        issue
      );

      // Create analysis embed
      const analysisEmbed = new EmbedBuilder()
        .setColor(analysisResult.success ? 0x9C27B0 : 0xff9500)
        .setTitle(`${analysisResult.success ? '🤖' : '🔍'} Code Analysis: ${problem.title}`)
        .setDescription(analysisResult.text)
        .addFields([
          {
            name: '🐛 Issue Reported',
            value: `"${issue}"`,
            inline: false
          },
          {
            name: '💻 Language',
            value: language.toUpperCase(),
            inline: true
          },
          {
            name: '📊 Problem Difficulty',
            value: problem.difficulty,
            inline: true
          }
        ])
        .setFooter({ 
          text: `${analysisResult.success ? '🤖 AI Analysis' : '🔍 Basic Analysis'} • Keep refining your solution!`,
          iconURL: user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      // Add code snippet field (truncated for embed limits)
      const truncatedCode = userCode.length > 200 ? 
        userCode.substring(0, 200) + '...' : userCode;
      
      analysisEmbed.addFields({
        name: '📝 Your Code (Preview)',
        value: `\`\`\`${language}\n${truncatedCode}\n\`\`\``,
        inline: false
      });

      // Send full code in a separate message if it was truncated
      if (userCode.length > 200) {
        await sendThreadMessage(activeThread, {
          content: `**📄 Full Code Submission:**\n\`\`\`${language}\n${userCode}\n\`\`\``
        });
      }

      // Send analysis to thread
      await sendThreadMessage(activeThread, { embeds: [analysisEmbed] });

      // Update user activity
      const dbUser = await User.findOne({ discordId: user.id });
      if (dbUser) {
        // Track code analysis usage
        if (!dbUser.stats) {
          dbUser.stats = {
            hintsRequested: 0,
            aiHintsUsed: 0,
            fallbackHintsUsed: 0,
            problemsWithHints: [],
            lastHintRequestAt: null
          };
        }
        
        dbUser.stats.codeAnalysisRequested = (dbUser.stats.codeAnalysisRequested || 0) + 1;
        if (analysisResult.success) {
          dbUser.stats.aiCodeAnalysisUsed = (dbUser.stats.aiCodeAnalysisUsed || 0) + 1;
        }
        
        dbUser.lastActive = new Date();
        await dbUser.save();
      }

      // Reply with success message
      await interaction.editReply({
        content: `🤖 **Code analysis complete!** Check your thread: ${activeThread.toString()}\n\n${analysisResult.success ? '🎯 AI-powered' : '📋 Basic'} analysis sent with targeted suggestions for your issue: "${issue.substring(0, 50)}${issue.length > 50 ? '...' : ''}"`,
      });

      logger.info(`Code analysis provided to ${user.username} for problem: ${problem.title}`);

    } catch (error) {
      logger.error('Error in analyze command:', error);
      await interaction.editReply({
        content: '❌ **Error:** Something went wrong while analyzing your code. Please try again later.',
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