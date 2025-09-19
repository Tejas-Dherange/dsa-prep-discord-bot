import { logger } from '../../config/discordClient.js';

export default {
  name: 'interactionCreate',
  execute(interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        logger.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        command.execute(interaction);
        logger.info(`Slash command ${interaction.commandName} executed by ${interaction.user.tag}`);
      } catch (error) {
        logger.error('Error executing slash command:', error);
        
        if (interaction.replied || interaction.deferred) {
          interaction.followUp({ 
            content: 'There was an error while executing this command!', 
            ephemeral: true 
          });
        } else {
          interaction.reply({ 
            content: 'There was an error while executing this command!', 
            ephemeral: true 
          });
        }
      }
    }

    // Handle button interactions
    if (interaction.isButton()) {
      logger.info(`Button ${interaction.customId} clicked by ${interaction.user.tag}`);
      
      // Handle different button types
      if (interaction.customId === 'submit_solution') {
        interaction.reply({
          content: '✅ Solution submission feature coming soon!',
          ephemeral: true
        });
      }
      
      if (interaction.customId === 'hint_request') {
        interaction.reply({
          content: '💡 Hint system coming soon! Try to solve it yourself first.',
          ephemeral: true
        });
      }
    }

    // Handle select menu interactions
    if (interaction.isSelectMenu()) {
      logger.info(`Select menu ${interaction.customId} used by ${interaction.user.tag}`);
      
      if (interaction.customId === 'difficulty_select') {
        const selectedDifficulty = interaction.values[0];
        interaction.reply({
          content: `🎯 You selected ${selectedDifficulty} difficulty problems!`,
          ephemeral: true
        });
      }
    }
  },
};