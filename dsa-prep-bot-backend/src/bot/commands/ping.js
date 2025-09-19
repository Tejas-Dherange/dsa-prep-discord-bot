import { SlashCommandBuilder } from 'discord.js';
import { withActivityTracking } from '../../utils/userActivity.js';

const execute = async (interaction) => {
  const sent = await interaction.reply({ 
    content: 'Pinging...', 
    fetchReply: true 
  });
  
  const timeTaken = sent.createdTimestamp - interaction.createdTimestamp;
  
  await interaction.editReply({
    content: `🏓 Pong! Latency is ${timeTaken}ms. API Latency is ${Math.round(interaction.client.ws.ping)}ms`
  });
};

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  execute: withActivityTracking(execute),
};