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

/**
 * Create or find an existing thread for a user in a specific channel
 * @param {Object} channel - Discord channel object
 * @param {Object} user - Discord user object
 * @param {string} threadType - Type of thread (e.g., 'hints', 'solution')
 * @returns {Promise<Object|null>} - Thread object or null if failed
 */
export const createOrFindUserThread = async (channel, user, threadType) => {
  try {
    if (!channel || !user) {
      throw new Error('Channel or user not provided');
    }

    const threadName = `${threadType} for ${user.username}`;
    
    // First, check if a thread already exists for this user
    const existingThreads = await channel.threads.fetch();
    const userThread = existingThreads.threads.find(thread => 
      thread.name === threadName && !thread.archived
    );

    if (userThread) {
      // Thread exists and is not archived, return it
      return userThread;
    }

    // Create a new private thread
    const newThread = await channel.threads.create({
      name: threadName,
      autoArchiveDuration: 1440, // 24 hours in minutes
      type: 12, // Private thread
      reason: `Automated ${threadType} thread for ${user.username}`,
    });

    // Add the user to the thread
    await newThread.members.add(user.id);

    console.log(`Created new ${threadType} thread for user ${user.username}`);
    return newThread;

  } catch (error) {
    console.error(`Error creating/finding user thread:`, error);
    return null;
  }
};

/**
 * Archive old threads that haven't been used recently
 * @param {Object} channel - Discord channel object
 * @param {number} hoursOld - Archive threads older than this many hours (default: 24)
 * @returns {Promise<number>} - Number of threads archived
 */
export const archiveOldThreads = async (channel, hoursOld = 24) => {
  try {
    if (!channel) {
      throw new Error('Channel not provided');
    }

    const threads = await channel.threads.fetch();
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);
    let archivedCount = 0;

    for (const thread of threads.threads.values()) {
      if (thread.archived) continue;

      // Check if the last message is older than cutoff
      const messages = await thread.messages.fetch({ limit: 1 });
      const lastMessage = messages.first();
      
      if (!lastMessage || lastMessage.createdAt < cutoffTime) {
        await thread.setArchived(true);
        archivedCount++;
        console.log(`Archived old thread: ${thread.name}`);
      }
    }

    return archivedCount;
  } catch (error) {
    console.error('Error archiving old threads:', error);
    return 0;
  }
};

/**
 * Send a message to a specific thread
 * @param {Object} thread - Discord thread object
 * @param {string|Object} content - Message content (string or embed object)
 * @returns {Promise<Object|null>} - Message object or null if failed
 */
export const sendThreadMessage = async (thread, content) => {
  try {
    if (!thread) {
      throw new Error('Thread not provided');
    }

    const message = await thread.send(content);
    return message;
  } catch (error) {
    console.error('Error sending thread message:', error);
    return null;
  }
};

/**
 * Get user's active thread in a channel
 * @param {Object} channel - Discord channel object
 * @param {Object} user - Discord user object
 * @param {string} threadType - Type of thread to look for
 * @returns {Promise<Object|null>} - Thread object or null if not found
 */
export const getUserActiveThread = async (channel, user, threadType) => {
  try {
    if (!channel || !user) {
      return null;
    }

    const threadName = `${threadType} for ${user.username}`;
    const threads = await channel.threads.fetch();
    
    return threads.threads.find(thread => 
      thread.name === threadName && !thread.archived
    ) || null;

  } catch (error) {
    console.error('Error getting user active thread:', error);
    return null;
  }
};