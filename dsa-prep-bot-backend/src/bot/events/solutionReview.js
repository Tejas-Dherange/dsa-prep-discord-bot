import { Events } from 'discord.js';
import { logger } from '../../config/discordClient.js';
import { SOLUTION_CONFIG, getScoreReactions } from '../config/solutionConfig.js';
import {
  extractCodeFromMessage,
  extractProblemReference,
  validateSolution,
  createReviewEmbed,
  saveSubmission
} from '../services/solutionValidator.js';
import { createOrFindUserThread, sendThreadMessage } from '../../utils/discordUtils.js';

const SOLUTION_REVIEW_CHANNEL_ID = SOLUTION_CONFIG.REVIEW_CHANNEL_ID;

export default {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Only process messages in the solution review channel
    if (message.channel.id !== SOLUTION_REVIEW_CHANNEL_ID) return;
    
    try {
      // Extract code from the message
      const codeBlocks = extractCodeFromMessage(message.content);
      
      if (codeBlocks.length === 0) {
        // No code found, send help message
        await message.react('❓');
        await message.reply({
          content: SOLUTION_CONFIG.MESSAGES.NO_CODE,
          ephemeral: false
        });
        return;
      }
      
      // Check code length
      const codeBlock = codeBlocks[0];
      if (codeBlock.code.length > SOLUTION_CONFIG.AI_SETTINGS.MAX_CODE_LENGTH) {
        await message.react('❌');
        await message.reply({
          content: SOLUTION_CONFIG.MESSAGES.CODE_TOO_LONG,
          ephemeral: false
        });
        return;
      }
      
      // Add processing reaction
      await message.react('⏳');
      
      // Extract problem reference
      const problem = await extractProblemReference(message.content);
      
      if (!problem) {
        await message.react('❌');
        await message.reply({
          content: SOLUTION_CONFIG.MESSAGES.NO_PROBLEM,
          ephemeral: false
        });
        return;
      }
      
      // Process each code block (usually just one)
      for (const codeBlock of codeBlocks) {
        try {
          logger.info(`Validating solution for ${problem.title} by ${message.author.username}`);
          
          // Create or find user's solution thread
          const solutionThread = await createOrFindUserThread(message.channel, message.author, 'Solutions');
          
          // Validate the solution using AI
          const review = await validateSolution(codeBlock.code, problem, codeBlock.language);
          
          // Extract score from review
          const scoreMatch = review.match(/score[:\s]*(\d+(?:\.\d+)?)/i);
          const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
          
          // Create review embed
          const reviewEmbed = createReviewEmbed(message.author, problem, codeBlock, review, score);
          
          let reviewMessage;
          
          // Check if embed is too large, if so, send as multiple messages
          const embedSize = JSON.stringify(reviewEmbed).length;
          
          if (embedSize > 5000) { // Discord embed limit is 6000 characters total
            // Send a simplified embed and the full review as text
            const simpleEmbed = {
              color: reviewEmbed.color,
              title: reviewEmbed.title,
              author: reviewEmbed.author,
              fields: reviewEmbed.fields.slice(0, 3), // Only basic info fields
              footer: reviewEmbed.footer,
              timestamp: reviewEmbed.timestamp
            };
            
            if (solutionThread) {
              // Send to thread if available
              await sendThreadMessage(solutionThread, { embeds: [simpleEmbed] });
              reviewMessage = await sendThreadMessage(solutionThread, {
                content: `**🎯 Full AI Review:**\n\`\`\`\n${review.substring(0, 1900)}\n\`\`\`${review.length > 1900 ? '\n*Review truncated due to length limits.*' : ''}`
              });
              
              // Also send a summary to the main channel
              await message.reply({
                content: `✅ **Solution reviewed!** Check your private thread: ${solutionThread.toString()}\n\n**Quick Summary:** Score ${score}/10 - ${score >= 7 ? 'Great work!' : score >= 5 ? 'Good progress!' : 'Keep improving!'}`
              });
            } else {
              // Fallback to main channel if thread creation fails
              await message.reply({ embeds: [simpleEmbed] });
              reviewMessage = await message.reply({
                content: `**🎯 Full AI Review:**\n\`\`\`\n${review.substring(0, 1900)}\n\`\`\`${review.length > 1900 ? '\n*Review truncated due to length limits.*' : ''}`
              });
            }
          } else {
            if (solutionThread) {
              // Send the normal embed to thread
              reviewMessage = await sendThreadMessage(solutionThread, { embeds: [reviewEmbed] });
              
              // Send summary to main channel
              await message.reply({
                content: `✅ **Solution reviewed!** Check your private thread: ${solutionThread.toString()}\n\n**Quick Summary:** Score ${score}/10 - ${getQuickFeedback(score)}`
              });
            } else {
              // Fallback to main channel if thread creation fails
              reviewMessage = await message.reply({ embeds: [reviewEmbed] });
            }
          }
          
          // Add score-based reactions to the review message
          if (score && reviewMessage) {
            const reactions = getScoreReactions(score);
            for (const reaction of reactions) {
              try {
                await reviewMessage.react(reaction);
              } catch (reactionError) {
                logger.warn(`Failed to add reaction ${reaction}:`, reactionError.message);
              }
            }
          }
          
          // Save to database
          await saveSubmission(message.author, problem, codeBlock, review, score);
          
          // Update original message reactions
          await message.react('✅');
          try {
            await message.reactions.resolve('⏳')?.remove();
          } catch (error) {
            // Ignore removal errors
          }
          
          logger.info(`Solution review completed for ${message.author.username} in ${solutionThread ? 'thread' : 'main channel'}`);
          
        } catch (error) {
          logger.error('Error processing code block:', error);
          await message.react('❌');
          await message.reply({
            content: `❌ **Error processing your solution:**
${error.message}

Please try again or contact an admin if the issue persists.`,
            ephemeral: false
          });
        }
      }
      
    } catch (error) {
      logger.error('Error in solution validation:', error);
      await message.react('❌');
      await message.reply({
        content: SOLUTION_CONFIG.MESSAGES.ERROR,
        ephemeral: false
      });
    }
  },
};

/**
 * Get quick feedback message based on score
 * @param {number} score - Solution score (1-10)
 * @returns {string} - Quick feedback message
 */
function getQuickFeedback(score) {
  if (score >= 8) return 'Excellent solution! 🎉';
  if (score >= 7) return 'Great work! 👍';
  if (score >= 5) return 'Good progress! Keep it up! 💪';
  if (score >= 3) return 'Room for improvement, but you\'re learning! 📚';
  return 'Keep practicing, you\'ve got this! 🚀';
}