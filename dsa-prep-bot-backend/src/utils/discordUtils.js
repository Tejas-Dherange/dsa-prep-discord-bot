import { client } from '../config/discordClient.js';

/**
 * Get active users from Discord guild
 * @param {string} guildId - Discord guild/server ID
 * @returns {Promise<Object>} - Active users statistics
 */
export const getDiscordActiveUsers = async (guildId = null) => {
  try {
    if (!client.isReady()) {
      return {
        online: 0,
        idle: 0,
        dnd: 0,
        offline: 0,
        total: 0,
        activeUsers: 0
      };
    }

    // If no guildId provided, get the first guild (assuming single server bot)
    const guild = guildId ? client.guilds.cache.get(guildId) : client.guilds.cache.first();
    
    if (!guild) {
      return {
        online: 0,
        idle: 0,
        dnd: 0,
        offline: 0,
        total: 0,
        activeUsers: 0
      };
    }

    // Fetch all members to get their presence
    await guild.members.fetch();
    
    const members = guild.members.cache;
    const stats = {
      online: 0,
      idle: 0,
      dnd: 0,
      offline: 0,
      total: members.size,
      activeUsers: 0
    };

    members.forEach(member => {
      if (member.user.bot) return; // Skip bots
      
      const presence = member.presence;
      const status = presence?.status || 'offline';
      
      switch (status) {
        case 'online':
          stats.online++;
          stats.activeUsers++;
          break;
        case 'idle':
          stats.idle++;
          stats.activeUsers++;
          break;
        case 'dnd':
          stats.dnd++;
          stats.activeUsers++;
          break;
        case 'offline':
        default:
          stats.offline++;
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting Discord active users:', error);
    return {
      online: 0,
      idle: 0,
      dnd: 0,
      offline: 0,
      total: 0,
      activeUsers: 0
    };
  }
};

/**
 * Get Discord guild information
 * @param {string} guildId - Discord guild/server ID
 * @returns {Promise<Object>} - Guild information
 */
export const getDiscordGuildInfo = async (guildId = null) => {
  try {
    if (!client.isReady()) {
      return null;
    }

    const guild = guildId ? client.guilds.cache.get(guildId) : client.guilds.cache.first();
    
    if (!guild) {
      return null;
    }

    return {
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      description: guild.description,
      icon: guild.iconURL(),
      banner: guild.bannerURL(),
      createdAt: guild.createdAt,
      ownerId: guild.ownerId
    };
  } catch (error) {
    console.error('Error getting Discord guild info:', error);
    return null;
  }
};

/**
 * Get bot status and health from Discord
 * @returns {Promise<Object>} - Bot status information
 */
export const getDiscordBotStatus = async () => {
  try {
    return {
      isReady: client.isReady(),
      uptime: client.uptime,
      ping: client.ws.ping,
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
      channels: client.channels.cache.size,
      status: client.user?.presence?.status || 'offline'
    };
  } catch (error) {
    console.error('Error getting Discord bot status:', error);
    return {
      isReady: false,
      uptime: 0,
      ping: -1,
      guilds: 0,
      users: 0,
      channels: 0,
      status: 'offline'
    };
  }
};