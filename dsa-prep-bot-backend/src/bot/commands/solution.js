import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import Problem from '../../models/Problem.js';
import Submission from '../../models/Submission.js';
import User from '../../models/User.js';
import { logger } from '../../config/discordClient.js';
import { SOLUTION_CONFIG } from '../config/solutionConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('solution')
    .setDescription('Get information about solution reviews')
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('View your solution submission statistics')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('recent')
        .setDescription('View your recent solution reviews')
        .addIntegerOption(option =>
          option.setName('limit')
            .setDescription('Number of recent reviews to show (1-10)')
            .setMinValue(1)
            .setMaxValue(10)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('help')
        .setDescription('Learn how to submit solutions for review')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'help') {
        const helpEmbed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle('🤖 AI Solution Review Guide')
          .setDescription('Learn how to get your DSA solutions reviewed by our AI assistant!')
          .addFields(
            {
              name: '📝 How to Submit Solutions',
              value: `1. Go to the <#${SOLUTION_CONFIG.REVIEW_CHANNEL_ID}> channel
2. Post your code in a code block using \`\`\`language
3. Mention the problem name or include LeetCode link
4. Wait for AI review and feedback!`,
              inline: false
            },
            {
              name: '💻 Code Format Example',
              value: '```python\ndef twoSum(nums, target):\n    # Your solution here\n    return []\n```\nProblem: Two Sum',
              inline: false
            },
            {
              name: '🎯 What the AI Reviews',
              value: '• Correctness of solution\n• Time & Space complexity\n• Code quality and style\n• Edge case handling\n• Optimization suggestions\n• Overall score (1-10)',
              inline: false
            },
            {
              name: '📊 Scoring System',
              value: '🎉 8-10: Excellent solution\n👍 6-7: Good solution\n💡 4-5: Needs improvement\n🔄 1-3: Major issues',
              inline: false
            }
          )
          .setFooter({ text: 'Happy coding! 🚀' })
          .setTimestamp();

        await interaction.reply({ embeds: [helpEmbed] });
        return;
      }

      // Find user in database
      const user = await User.findOne({ discordId: interaction.user.id });
      
      if (!user) {
        const noUserEmbed = new EmbedBuilder()
          .setColor(0xff9500)
          .setTitle('👋 Welcome!')
          .setDescription('You haven\'t submitted any solutions yet!')
          .addFields([{
            name: '🚀 Get Started',
            value: `Submit your first solution in <#${SOLUTION_CONFIG.REVIEW_CHANNEL_ID}> to see your stats here!`,
            inline: false
          }]);

        await interaction.reply({ embeds: [noUserEmbed] });
        return;
      }

      if (subcommand === 'stats') {
        const submissions = await Submission.find({ userId: user._id });
        const totalSubmissions = submissions.length;
        
        if (totalSubmissions === 0) {
          const noStatsEmbed = new EmbedBuilder()
            .setColor(0xff9500)
            .setTitle('📊 Your Solution Stats')
            .setDescription('No submissions yet!')
            .addFields([{
              name: '🚀 Get Started',
              value: `Submit your first solution in <#${SOLUTION_CONFIG.REVIEW_CHANNEL_ID}>!`,
              inline: false
            }]);

          await interaction.reply({ embeds: [noStatsEmbed] });
          return;
        }

        // Calculate statistics
        const acceptedSubmissions = submissions.filter(s => s.status === 'Accepted').length;
        const averageScore = submissions
          .filter(s => s.score !== null)
          .reduce((sum, s) => sum + s.score, 0) / submissions.filter(s => s.score !== null).length;
        
        const languageStats = submissions.reduce((acc, s) => {
          acc[s.language] = (acc[s.language] || 0) + 1;
          return acc;
        }, {});

        const topLanguages = Object.entries(languageStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([lang, count]) => `${lang}: ${count}`)
          .join('\n') || 'None';

        const statsEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('📊 Your Solution Statistics')
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          })
          .addFields(
            {
              name: '📈 Overall Stats',
              value: `**Total Submissions:** ${totalSubmissions}
**Accepted Solutions:** ${acceptedSubmissions}
**Success Rate:** ${((acceptedSubmissions / totalSubmissions) * 100).toFixed(1)}%
**Average Score:** ${averageScore ? averageScore.toFixed(1) : 'N/A'}/10`,
              inline: true
            },
            {
              name: '💻 Top Languages',
              value: topLanguages,
              inline: true
            },
            {
              name: '🏆 Achievements',
              value: user.totalSolved > 0 ? `${user.totalSolved} problems solved` : 'Keep coding!',
              inline: true
            }
          )
          .setFooter({ text: 'Keep up the great work! 🚀' })
          .setTimestamp();

        await interaction.reply({ embeds: [statsEmbed] });
      }

      if (subcommand === 'recent') {
        const limit = interaction.options.getInteger('limit') || 5;
        
        const recentSubmissions = await Submission.find({ userId: user._id })
          .populate('problemId', 'title difficulty')
          .sort({ submissionTime: -1 })
          .limit(limit);

        if (recentSubmissions.length === 0) {
          const noRecentEmbed = new EmbedBuilder()
            .setColor(0xff9500)
            .setTitle('📝 Recent Reviews')
            .setDescription('No recent submissions found!')
            .addFields([{
              name: '🚀 Get Started',
              value: `Submit solutions in <#${SOLUTION_CONFIG.REVIEW_CHANNEL_ID}> to see them here!`,
              inline: false
            }]);

          await interaction.reply({ embeds: [noRecentEmbed] });
          return;
        }

        const recentEmbed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle('📝 Your Recent Solution Reviews')
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true })
          });

        recentSubmissions.forEach((submission, index) => {
          const scoreText = submission.score ? `${submission.score}/10` : 'Unrated';
          const statusEmoji = submission.status === 'Accepted' ? '✅' : '⏳';
          
          recentEmbed.addFields([{
            name: `${index + 1}. ${statusEmoji} ${submission.problemId.title}`,
            value: `**Language:** ${submission.language}
**Score:** ${scoreText}
**Difficulty:** ${submission.problemId.difficulty}
**Submitted:** ${submission.submissionTime.toLocaleDateString()}`,
            inline: true
          }]);
        });

        recentEmbed.setFooter({ text: `Showing ${recentSubmissions.length} recent submissions` });

        await interaction.reply({ embeds: [recentEmbed] });
      }

    } catch (error) {
      logger.error('Error in solution command:', error);
      await interaction.reply({
        content: '❌ **Error:** Unable to process your request. Please try again later.',
        ephemeral: true
      });
    }
  },
};