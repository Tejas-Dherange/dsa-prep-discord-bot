import { client, logger } from '../config/discordClient.js';
import { startDailyChallengeJob } from './jobs/dailyChallenge.js';
import { startThreadCleanupScheduler } from './jobs/threadCleanup.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load event handlers
const loadEvents = async () => {
  const eventsPath = path.join(__dirname, 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = await import(`file://${filePath}`);
    
    if (event.default.once) {
      client.once(event.default.name, (...args) => event.default.execute(...args));
    } else {
      client.on(event.default.name, (...args) => event.default.execute(...args));
    }
    
    logger.info(`Loaded event: ${event.default.name}`);
  }
};

// Load slash commands
const loadCommands = async () => {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    
    if ('data' in command.default && 'execute' in command.default) {
      client.commands.set(command.default.data.name, command.default);
      logger.info(`Loaded command: ${command.default.data.name}`);
    } else {
      logger.warn(`Command at ${filePath} is missing required "data" or "execute" property.`);
    }
  }
};

// Initialize bot
const initializeBot = async () => {
  try {
    // Load events and commands
    await loadEvents();
    await loadCommands();
    
    // Start cron jobs
    startDailyChallengeJob();
    startThreadCleanupScheduler();
    
    // Login to Discord
    await client.login(process.env.BOT_TOKEN);
    
    logger.info('Discord bot initialized successfully');
    
  } catch (error) {
    logger.error('Failed to initialize Discord bot:', error);
    console.error('Failed to initialize Discord bot:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down Discord bot gracefully');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down Discord bot gracefully');
  client.destroy();
  process.exit(0);
});

export { initializeBot, client };