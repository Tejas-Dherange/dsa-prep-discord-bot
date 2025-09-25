import { client, logger } from '../../config/discordClient.js';
import { archiveOldThreads } from '../../utils/discordUtils.js';
import { ChannelType } from 'discord.js';

/**
 * Cleanup job for archiving old threads across all text channels
 * This helps keep the server organized and prevents thread clutter
 */
export const threadCleanupJob = async () => {
  try {
    if (!client.isReady()) {
      logger.warn('Bot not ready, skipping thread cleanup job');
      return;
    }

    logger.info('Starting thread cleanup job...');

    let totalArchivedCount = 0;
    const guilds = client.guilds.cache;

    for (const guild of guilds.values()) {
      try {
        // Get all text channels that might have threads
        const textChannels = guild.channels.cache.filter(
          channel => channel.type === ChannelType.GuildText
        );

        for (const channel of textChannels.values()) {
          try {
            // Only cleanup threads in specific channels if they exist
            const channelNamesWithThreads = [
              'hints',
              'help', 
              'solutions',
              'solution-review',
              'code-review',
              'general'
            ];

            const shouldCleanup = channelNamesWithThreads.some(name => 
              channel.name.toLowerCase().includes(name)
            );

            if (shouldCleanup) {
              const archivedCount = await archiveOldThreads(channel, 24); // Archive after 24 hours
              totalArchivedCount += archivedCount;

              if (archivedCount > 0) {
                logger.info(`Archived ${archivedCount} threads in #${channel.name}`);
              }
            }
          } catch (channelError) {
            logger.error(`Error cleaning up threads in channel ${channel.name}:`, channelError);
          }
        }
      } catch (guildError) {
        logger.error(`Error processing guild ${guild.name}:`, guildError);
      }
    }

    if (totalArchivedCount > 0) {
      logger.info(`Thread cleanup completed. Archived ${totalArchivedCount} threads total.`);
    } else {
      logger.info('Thread cleanup completed. No threads needed archiving.');
    }

  } catch (error) {
    logger.error('Error in thread cleanup job:', error);
  }
};

/**
 * Start the thread cleanup scheduler
 * Runs every 6 hours to keep threads organized
 */
export const startThreadCleanupScheduler = () => {
  // Run immediately on startup
  setTimeout(threadCleanupJob, 5000); // Wait 5 seconds for bot to be ready

  // Run every 6 hours (6 * 60 * 60 * 1000 = 21600000 ms)
  setInterval(threadCleanupJob, 6 * 60 * 60 * 1000);
  
  logger.info('Thread cleanup scheduler started - runs every 6 hours');
};

/**
 * Manual thread cleanup for specific channel
 * Can be called by admin commands or API endpoints
 */
export const cleanupChannelThreads = async (channelId, hoursOld = 24) => {
  try {
    if (!client.isReady()) {
      throw new Error('Bot not ready');
    }

    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      throw new Error(`Channel not found: ${channelId}`);
    }

    const archivedCount = await archiveOldThreads(channel, hoursOld);
    logger.info(`Manual cleanup: Archived ${archivedCount} threads in #${channel.name}`);
    
    return {
      success: true,
      channelName: channel.name,
      archivedCount,
      hoursOld
    };

  } catch (error) {
    logger.error('Error in manual thread cleanup:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  threadCleanupJob,
  startThreadCleanupScheduler,
  cleanupChannelThreads
};