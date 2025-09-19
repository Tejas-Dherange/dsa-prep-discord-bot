import { SlashCommandBuilder } from 'discord.js';
import { withActivityTracking } from '../../utils/userActivity.js';
import User from '../../models/User.js';

const execute = async (interaction) => {
  try {
    const user = await User.findOne({ discordId: interaction.user.id });
    
    if (!user) {
      await interaction.reply({
        content: '❌ User profile not found. Try using a command first to create your profile!',
        ephemeral: true
      });
      return;
    }

    const embed = {
      color: 0x0099ff,
      title: `📊 ${user.username}'s DSA Profile`,
      thumbnail: {
        url: user.avatar || interaction.user.displayAvatarURL()
      },
      fields: [
        {
          name: '🧩 Problems Solved',
          value: `**Total:** ${user.totalSolved}\n**Easy:** ${user.totalProblems.easy}\n**Medium:** ${user.totalProblems.medium}\n**Hard:** ${user.totalProblems.hard}`,
          inline: true
        },
        {
          name: '🔥 Streak',
          value: `**Current:** ${user.currentStreak} days\n**Longest:** ${user.longestStreak} days`,
          inline: true
        },
        {
          name: '⚙️ Settings',
          value: `**Daily Goal:** ${user.dailyGoal} problems\n**Preferred:** ${user.preferredDifficulty}\n**Reminders:** ${user.enableDailyReminders ? 'On' : 'Off'}`,
          inline: true
        },
        {
          name: '📅 Activity',
          value: `**Joined:** ${user.joinedAt.toDateString()}\n**Last Active:** ${user.lastActive.toDateString()}`,
          inline: false
        }
      ],
      footer: {
        text: `Completion Rate: ${user.completionRate}%`
      },
      timestamp: new Date().toISOString()
    };

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in profile command:', error);
    await interaction.reply({
      content: '❌ An error occurred while fetching your profile.',
      ephemeral: true
    });
  }
};

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your DSA progress profile'),
  execute: withActivityTracking(execute),
};