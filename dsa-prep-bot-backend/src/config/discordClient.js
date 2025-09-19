import { Client, GatewayIntentBits, Collection } from 'discord.js';
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'discord-bot' },
  transports: [
    new winston.transports.File({ filename: './logs/bot.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Create Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers, // For user management features
    GatewayIntentBits.GuildPresences // For user presence/status tracking
  ],
  partials: ['CHANNEL'] // For DM support
});

// Create collections for commands and events
client.commands = new Collection();
client.events = new Collection();

// Error handling
client.on('error', (error) => {
  logger.error('Discord client error:', error);
  console.error('Discord client error:', error);
});

client.on('warn', (warning) => {
  logger.warn('Discord client warning:', warning);
  console.warn('Discord client warning:', warning);
});

// Rate limit handling
client.on('rateLimit', (info) => {
  logger.warn('Rate limit hit:', info);
  console.warn('Rate limit hit:', info);
});

export { client, logger }; 