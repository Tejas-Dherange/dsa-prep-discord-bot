import { SlashCommandBuilder } from 'discord.js';
import { withActivityTracking } from '../../utils/userActivity.js';
import User from '../../models/User.js';

const execute = async (interaction) => {
  try {
    const topUsers = await User.getLeaderboard(10);
    
    if (!topUsers || topUsers.length === 0) {
      await interaction.reply({
        content: '📊 No users found on the leaderboard yet. Start solving problems to appear here!',
        ephemeral: true
      });
      return;
    }

    const leaderboardText = topUsers.map((user, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      return `${medal} **${user.username}** - ${user.totalSolved} problems (${user.currentStreak}🔥)`;
    }).join('\n');

    const embed = {
      color: 0xffd700,
      title: '🏆 DSA Leaderboard',
      description: leaderboardText,
      footer: {
        text: 'Keep solving problems to climb the leaderboard!'
      },
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in leaderboard command:', error);
    await interaction.reply({
      content: '❌ An error occurred while fetching the leaderboard.',
      ephemeral: true
    });
  }
};

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the top DSA problem solvers'),
  execute: withActivityTracking(execute),
};