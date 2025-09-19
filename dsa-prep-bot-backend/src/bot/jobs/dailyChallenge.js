import cron from 'node-cron';
import { client, logger } from '../../config/discordClient.js';
import Problem from '../../models/Problem.js';
import 'dotenv/config';

// Channel ID where daily challenges will be posted
// Replace with your actual channel ID
const DAILY_CHALLENGE_CHANNEL_ID = process.env.DAILY_CHALLENGE_CHANNEL_ID || '1417418921417510974';

/**
 * Get a dynamic problem for daily challenge
 * Uses intelligent selection to avoid recently posted problems
 */
const getDynamicDailyProblem = async () => {
  try {
    // First, try to get a problem marked as daily challenge
    let problem = await Problem.getDailyChallenge();
    
    if (problem) {
      return problem;
    }

    // If no daily problem is set, get a random problem with smart selection
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Avoid problems posted in the last 7 days
    const recentlyPostedProblems = await Problem.find({
      lastPostedAt: { $gte: sevenDaysAgo }
    }).select('_id');
    
    const excludeIds = recentlyPostedProblems.map(p => p._id);
    
    // Smart difficulty selection based on day of week
    const dayOfWeek = now.getDay();
    let targetDifficulty;
    
    if (dayOfWeek === 1 || dayOfWeek === 2) { // Monday, Tuesday - Easy
      targetDifficulty = 'Easy';
    } else if (dayOfWeek === 6 || dayOfWeek === 0) { // Saturday, Sunday - Hard
      targetDifficulty = 'Hard';
    } else { // Wednesday to Friday - Medium
      targetDifficulty = 'Medium';
    }
    
    // Try to get a problem with target difficulty
    const problemsWithTargetDifficulty = await Problem.getRandomByDifficulty(targetDifficulty, excludeIds);
    
    if (problemsWithTargetDifficulty.length > 0) {
      return problemsWithTargetDifficulty[0];
    }
    
    // Fallback: get any active problem
    const fallbackProblem = await Problem.aggregate([
      { 
        $match: { 
          isActive: true,
          _id: { $nin: excludeIds }
        } 
      },
      { $sample: { size: 1 } }
    ]);
    
    if (fallbackProblem.length > 0) {
      return fallbackProblem[0];
    }
    
    // Last resort: get any active problem (ignore recently posted)
    const lastResortProblem = await Problem.findOne({ isActive: true });
    return lastResortProblem;
    
  } catch (error) {
    logger.error('Error getting dynamic daily problem:', error);
    return null;
  }
};

const createDailyChallengeEmbed = (problem) => {
  const difficultyColors = {
    'Easy': 0x00ff00,
    'Medium': 0xffa500,
    'Hard': 0xff0000
  };

  const fields = [
    {
      name: '⭐ Difficulty',
      value: problem.difficulty,
      inline: true,
    },
    {
      name: '🏷️ Category',
      value: problem.category || 'General',
      inline: true,
    }
  ];

  // Add acceptance rate if available
  if (problem.acceptanceRate) {
    fields.push({
      name: '📊 Acceptance Rate',
      value: `${problem.acceptanceRate}%`,
      inline: true,
    });
  }

  // Add examples if available
  if (problem.examples && problem.examples.length > 0) {
    const example = problem.examples[0];
    const exampleText = `Input: ${example.input}\nOutput: ${example.output}${example.explanation ? '\nExplanation: ' + example.explanation : ''}`;
    fields.unshift({
      name: '📝 Example',
      value: `\`\`\`\n${exampleText}\n\`\`\``,
      inline: false,
    });
  }

  // Add constraints if available
  if (problem.constraints && problem.constraints.length > 0) {
    fields.push({
      name: '⚠️ Constraints',
      value: problem.constraints.slice(0, 3).join('\n'), // Limit to first 3 constraints
      inline: false,
    });
  }

  // Add tags if available
  if (problem.tags && problem.tags.length > 0) {
    fields.push({
      name: '� Tags',
      value: problem.tags.slice(0, 5).join(', '), // Limit to first 5 tags
      inline: false,
    });
  }

  // Add LeetCode link if available
  if (problem.leetcodeUrl) {
    fields.push({
      name: '🔗 LeetCode Link',
      value: `[Solve on LeetCode](${problem.leetcodeUrl})`,
      inline: true,
    });
  }

  return {
    color: difficultyColors[problem.difficulty] || 0x0099ff,
    title: `📊 Daily DSA Challenge: ${problem.title}`,
    description: problem.description.length > 300 
      ? problem.description.substring(0, 300) + '...' 
      : problem.description,
    fields: fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: `Daily Challenge • React with ✅ when solved! • Problem ID: ${problem._id.toString().slice(-6)}`,
    },
  };
};

const postDailyChallenge = async () => {
  try {
    if (!client.isReady()) {
      logger.warn('Bot is not ready, skipping daily challenge post');
      return;
    }

    const channel = client.channels.cache.get(DAILY_CHALLENGE_CHANNEL_ID);
    
    if (!channel) {
      logger.error(`Daily challenge channel not found: ${DAILY_CHALLENGE_CHANNEL_ID}`);
      return;
    }

    // Get dynamic problem from database
    const todaysProblem = await getDynamicDailyProblem();
    
    if (!todaysProblem) {
      logger.error('No problems available for daily challenge');
      await channel.send('❌ No problems available for today\'s challenge. Please add some problems to the database!');
      return;
    }
    
    const embed = createDailyChallengeEmbed(todaysProblem);
    
    const message = await channel.send({ 
      content: '🌅 **Good morning, coding warriors!** Here\'s your daily DSA challenge:',
      embeds: [embed] 
    });

    // Add reactions for interaction
    await message.react('✅'); // Solved
    await message.react('💭'); // Need hint
    await message.react('❓'); // Question
    await message.react('🔥'); // Awesome problem

    // Update problem statistics
    if (todaysProblem._id) {
      await Problem.findByIdAndUpdate(todaysProblem._id, {
        $inc: { timesPosted: 1 },
        lastPostedAt: new Date()
      });
    }

    logger.info(`Daily challenge posted: ${todaysProblem.title} (${todaysProblem.difficulty})`);
    console.log(`📊 Daily challenge posted: ${todaysProblem.title} (${todaysProblem.difficulty})`);

  } catch (error) {
    logger.error('Error posting daily challenge:', error);
    console.error('Error posting daily challenge:', error);
  }
};

// Schedule daily challenge for 10:00 AM every day
// Cron format: second minute hour day month dayOfWeek
const startDailyChallengeJob = () => {
  // Run at 10:33 AM every day
  cron.schedule('0 33 10 * * *', () => {
    logger.info('Running daily challenge cron job');
    postDailyChallenge();
  }, {
    timezone: "Asia/Kolkata" // Adjust timezone as needed
  });

  // Also run a test post immediately on startup (for testing)
  // setTimeout(() => {
  //   logger.info('Running test daily challenge post in 10 seconds');
  //   console.log('🧪 Running test daily challenge post in 10 seconds');
  //   postDailyChallenge();
  // }, 10000);

  logger.info('Daily challenge cron job scheduled for 10:00 AM daily');
  console.log('📅 Daily challenge cron job scheduled for 10:00 AM daily');
};

export { startDailyChallengeJob, postDailyChallenge };