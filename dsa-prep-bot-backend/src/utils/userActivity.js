import User from '../models/User.js';

/**
 * Updates user activity and creates user if doesn't exist
 * @param {Object} discordUser - Discord user object from interaction
 * @returns {Promise<Object>} - Updated user document
 */
export const updateUserActivity = async (discordUser) => {
  try {
    const user = await User.findOneAndUpdate(
      { discordId: discordUser.id },
      { 
        $set: { 
          lastActive: new Date(),
          username: discordUser.username,
          avatar: discordUser.displayAvatarURL()
        },
        $setOnInsert: { 
          discordId: discordUser.id,
          joinedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
    
    return user;
  } catch (error) {
    console.error('Error updating user activity:', error);
    throw error;
  }
};

/**
 * Gets or creates a user from Discord interaction
 * @param {Object} interaction - Discord interaction object
 * @returns {Promise<Object>} - User document
 */
export const getUserFromInteraction = async (interaction) => {
  return await updateUserActivity(interaction.user);
};

/**
 * Middleware function to track user activity for all bot commands
 * @param {Function} commandExecute - Original command execute function
 * @returns {Function} - Wrapped execute function with activity tracking
 */
export const withActivityTracking = (commandExecute) => {
  return async (interaction) => {
    try {
      // Track user activity first
      await updateUserActivity(interaction.user);
      
      // Execute the original command
      return await commandExecute(interaction);
    } catch (error) {
      console.error('Error in activity tracking wrapper:', error);
      // Still execute the command even if activity tracking fails
      return await commandExecute(interaction);
    }
  };
};