import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import User from '../../models/User.js';
import { logger } from '../../config/discordClient.js';
import { getUserActiveThread, sendThreadMessage } from '../../utils/discordUtils.js';
import { hintAgent } from '../agent/hintAgent.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask a follow-up question about your recent hint in your thread')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Your question or what you\'re struggling with')
        .setRequired(true)
        .setMaxLength(500)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const question = interaction.options.getString('question');
      const user = interaction.user;

      // Find user's active hints thread
      const hintsChannelId = process.env.HINTS_CHANNEL_ID;
      let hintsChannel;

      if (hintsChannelId) {
        hintsChannel = interaction.guild.channels.cache.get(hintsChannelId);
      } else {
        // Look for hints channel
        hintsChannel = interaction.guild.channels.cache.find(
          channel => channel.name.includes('hint') || channel.name.includes('help')
        );
      }

      if (!hintsChannel) {
        await interaction.editReply({
          content: '❌ **Error:** Hints channel not found. Please use `/hint` command first to create your thread.',
        });
        return;
      }

      // Get user's active thread
      const activeThread = await getUserActiveThread(hintsChannel, user, 'Hints');
      
      if (!activeThread) {
        await interaction.editReply({
          content: '❌ **No active thread found!** Please use `/hint [problem]` first to create your hints thread.',
        });
        return;
      }

      // Get user's recent hint history for context
      const dbUser = await User.findOne({ discordId: user.id });
      const recentHints = await getRecentThreadMessages(activeThread, 5);

      // Generate AI follow-up response
      const followUpResult = await hintAgent.generateFollowUpHint(
        { title: "Current Problem" }, // We don't have easy access to specific problem here
        question,
        recentHints.map(msg => ({ text: msg.content }))
      );

      // Create follow-up embed
      const followUpEmbed = new EmbedBuilder()
        .setColor(followUpResult.success ? 0x2196F3 : 0xff9500)
        .setTitle(`${followUpResult.success ? '🤖' : '💭'} Follow-up Response`)
        .setDescription(followUpResult.text)
        .addFields({
          name: '❓ Your Question',
          value: `"${question}"`,
          inline: false
        })
        .setFooter({ 
          text: `${followUpResult.success ? '🤖 AI-Generated' : '💡 Fallback'} Response • Keep asking questions!`,
          iconURL: user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      // Send follow-up to thread
      await sendThreadMessage(activeThread, { embeds: [followUpEmbed] });

      // Update user activity
      if (dbUser) {
        dbUser.lastActive = new Date();
        await dbUser.save();
      }

      // Reply with success
      await interaction.editReply({
        content: `💬 **Follow-up sent!** Check your thread: ${activeThread.toString()}\n\n${followUpResult.success ? '🤖 AI' : '💡 Fallback'} response generated based on your question.`,
      });

      logger.info(`Follow-up question answered for ${user.username}: "${question.substring(0, 50)}..."`);

    } catch (error) {
      logger.error('Error in ask command:', error);
      await interaction.editReply({
        content: '❌ **Error:** Something went wrong while processing your question. Please try again later.',
      });
    }
  },
};

/**
 * Get recent messages from a thread for context
 * @param {Object} thread - Discord thread object
 * @param {number} limit - Number of messages to fetch
 * @returns {Promise<Array>} - Array of recent messages
 */
async function getRecentThreadMessages(thread, limit = 5) {
  try {
    const messages = await thread.messages.fetch({ limit });
    return Array.from(messages.values())
      .reverse() // Oldest first
      .filter(msg => !msg.author.bot || msg.embeds.length > 0) // Include bot messages with embeds (hints)
      .map(msg => ({
        content: msg.content || (msg.embeds[0]?.description || ''),
        author: msg.author.username,
        timestamp: msg.createdAt
      }));
  } catch (error) {
    logger.error('Error fetching thread messages:', error);
    return [];
  }
}