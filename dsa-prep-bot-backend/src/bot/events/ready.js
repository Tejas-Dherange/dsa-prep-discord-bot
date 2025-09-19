import { logger } from '../../config/discordClient.js';

export default {
  name: 'ready',
  once: true,
  execute(client) {
    logger.info(`Discord bot logged in as ${client.user.tag}!`);
    console.log(`🤖 Bot is online! Logged in as ${client.user.tag}`);
    
    // Set bot activity/status
    client.user.setActivity('DSA problems | !help', { type: 'WATCHING' });
  },
};