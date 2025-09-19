import { logger } from '../../config/discordClient.js';
import { REST, Routes } from 'discord.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`Discord bot logged in as ${client.user.tag}!`);
    console.log(`🤖 Bot is online! Logged in as ${client.user.tag}`);
    
    // Set bot activity/status
    client.user.setActivity('DSA problems | /help', { type: 'WATCHING' });
    
    // Register slash commands
    try {
      logger.info('Started refreshing application (/) commands.');
      
      const commands = [];
      client.commands.forEach(command => {
        if (command.data) {
          commands.push(command.data.toJSON());
        }
      });
      
      const rest = new REST().setToken(process.env.BOT_TOKEN);
      
      // Register commands globally (takes up to 1 hour to propagate)
      // For faster testing, you can register to a specific guild instead
      if (process.env.GUILD_ID) {
        // Guild-specific registration (instant)
        await rest.put(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
          { body: commands },
        );
        logger.info(`Successfully reloaded ${commands.length} guild application (/) commands.`);
        console.log(`✅ Registered ${commands.length} commands for guild ${process.env.GUILD_ID}`);
      } else {
        // Global registration
        await rest.put(
          Routes.applicationCommands(process.env.CLIENT_ID),
          { body: commands },
        );
        logger.info(`Successfully reloaded ${commands.length} global application (/) commands.`);
        console.log(`✅ Registered ${commands.length} commands globally (may take up to 1 hour to appear)`);
      }
      
    } catch (error) {
      logger.error('Error registering slash commands:', error);
      console.error('Error registering slash commands:', error);
    }
  },
};