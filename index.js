//make basic discord bot here
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const token = process.env.TOKEN;

client.once('ready', () => {
    console.log('Bot is online!');
});
client.on('messageCreate', message => {
   if(message.author.bot) return;
    console.log(message.content);
    console.log(message.channelId);
    
    
    if (message.content === 'ping') {
        message.channel.send('Pong.');
    }
});

client.login(token);
