import { logger } from '../../config/discordClient.js';

export default {
  name: 'messageCreate',
  execute(message) {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Handle basic commands
    if (message.content === 'ping') {
      message.reply('Pong! 🏓');
      logger.info(`Ping command executed by ${message.author.tag}`);
    }

    if (message.content === 'hii') {
        message.reply('Hello! How can I assist you with your DSA preparation today? 🤖');
        logger.info(`Greeting command executed by ${message.author.tag}`);
    }
    if (message.content === '!help') { 
      const helpEmbed = {
        color: 0x0099FF,
        title: '🤖 DSA Prep Bot Commands',
        description: 'Here are the available commands:',
        fields: [
          {
            name: '!ping',
            value: 'Test if the bot is responsive',
            inline: true,
          },
          {
            name: '!daily',
            value: 'Get today\'s DSA problem',
            inline: true,
          },
          {
            name: '!streak',
            value: 'Check your current streak',
            inline: true,
          },
          {
            name: '!leaderboard',
            value: 'View the top performers',
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'DSA Prep Bot',
        },
      };

      message.reply({ embeds: [helpEmbed] });
      logger.info(`Help command executed by ${message.author.tag}`);
    }

    if (message.content === '!daily') {
      // This will be enhanced when we integrate with the daily challenge system
      message.reply('📊 Daily challenge feature coming soon! Stay tuned.');
      logger.info(`Daily command executed by ${message.author.tag}`);
    }

    if (message.content === '!streak') {
      // This will be enhanced when we integrate with the streak system
      message.reply('🔥 Streak tracking feature coming soon! Keep practicing.');
      logger.info(`Streak command executed by ${message.author.tag}`);
    }

    if (message.content === '!leaderboard') {
      // This will be enhanced when we integrate with the leaderboard system
      message.reply('🏆 Leaderboard feature coming soon! Competition awaits.');
      logger.info(`Leaderboard command executed by ${message.author.tag}`);
    }

    // Log all messages for analytics (optional)
    logger.info(`Message from ${message.author.tag}: ${message.content.substring(0, 100)}...`);
  },
};