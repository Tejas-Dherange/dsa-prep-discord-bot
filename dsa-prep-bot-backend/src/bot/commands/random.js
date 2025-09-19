import { SlashCommandBuilder } from 'discord.js';
import { withActivityTracking } from '../../utils/userActivity.js';
import Problem from '../../models/Problem.js';

const execute = async (interaction) => {
  const difficulty = interaction.options.getString('difficulty') || 'mixed';
  
  try {
    let filter = { isActive: true };
    if (difficulty !== 'mixed') {
      filter.difficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    }

    const problemCount = await Problem.countDocuments(filter);
    if (problemCount === 0) {
      await interaction.reply({
        content: `❌ No ${difficulty} problems found in the database.`,
        ephemeral: true
      });
      return;
    }

    // Get a random problem
    const randomIndex = Math.floor(Math.random() * problemCount);
    const problem = await Problem.findOne(filter).skip(randomIndex);

    if (!problem) {
      await interaction.reply({
        content: '❌ Could not find a random problem. Please try again.',
        ephemeral: true
      });
      return;
    }

    const difficultyColor = {
      'Easy': 0x00ff00,
      'Medium': 0xffff00,
      'Hard': 0xff0000
    };

    const embed = {
      color: difficultyColor[problem.difficulty] || 0x0099ff,
      title: `🧩 Random ${problem.difficulty} Problem`,
      fields: [
        {
          name: '📋 Problem',
          value: `**${problem.title}**\n[Problem #${problem.problemNumber}](${problem.leetcodeUrl})`,
          inline: false
        },
        {
          name: '📊 Stats',
          value: `**Difficulty:** ${problem.difficulty}\n**Submissions:** ${problem.submissionCount}\n**Acceptance:** ${problem.acceptanceRate}%`,
          inline: true
        },
        {
          name: '🏷️ Tags',
          value: problem.tags.slice(0, 5).map(tag => `\`${tag}\``).join(' ') || 'No tags',
          inline: true
        }
      ],
      footer: {
        text: 'Good luck solving this problem! 🚀'
      },
      timestamp: new Date().toISOString()
    };

    if (problem.description) {
      const shortDescription = problem.description.length > 200 
        ? problem.description.substring(0, 200) + '...' 
        : problem.description;
      
      embed.fields.unshift({
        name: '📝 Description',
        value: shortDescription,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error in random command:', error);
    await interaction.reply({
      content: '❌ An error occurred while fetching a random problem.',
      ephemeral: true
    });
  }
};

export default {
  data: new SlashCommandBuilder()
    .setName('random')
    .setDescription('Get a random DSA problem to solve')
    .addStringOption(option =>
      option.setName('difficulty')
        .setDescription('Problem difficulty preference')
        .setRequired(false)
        .addChoices(
          { name: 'Easy', value: 'easy' },
          { name: 'Medium', value: 'medium' },
          { name: 'Hard', value: 'hard' },
          { name: 'Mixed', value: 'mixed' }
        )
    ),
  execute: withActivityTracking(execute),
};