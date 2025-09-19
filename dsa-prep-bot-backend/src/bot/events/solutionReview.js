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
          
          // Validate the solution using AI
          const review = await validateSolution(codeBlock.code, problem, codeBlock.language);
          
          // Extract score from review
          const scoreMatch = review.match(/score[:\s]*(\d+(?:\.\d+)?)/i);
          const score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
          
          // Create review embed
          const reviewEmbed = createReviewEmbed(message.author, problem, codeBlock, review, score);
          
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
            
            await message.reply({
              embeds: [simpleEmbed]
            });
            
            // Send full review as a text message
            const reviewMessage = await message.reply({
              content: `**🎯 Full AI Review:**\n\`\`\`\n${review.substring(0, 1900)}\n\`\`\`${review.length > 1900 ? '\n*Review truncated due to length limits.*' : ''}`
            });
            
            // Add reactions to the review message
            if (score) {
              const reactions = getScoreReactions(score);
              for (const reaction of reactions) {
                try {
                  await reviewMessage.react(reaction);
                } catch (reactionError) {
                  logger.warn(`Failed to add reaction ${reaction}:`, reactionError.message);
                }
              }
            }
          } else {
            // Send the normal embed
            const reviewMessage = await message.reply({
              embeds: [reviewEmbed]
            });
            
            // Add score-based reactions
            if (score) {
              const reactions = getScoreReactions(score);
              for (const reaction of reactions) {
                try {
                  await reviewMessage.react(reaction);
                } catch (reactionError) {
                  logger.warn(`Failed to add reaction ${reaction}:`, reactionError.message);
                }
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
          
          logger.info(`Solution review completed for ${message.author.username}`);
          
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