import User from '../models/User.js';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { logger } from '../config/discordClient.js';

/**
 * Calculate and update user streak
 * @param {string} userId - User ID
 * @returns {Object} Updated streak information
 */
export const updateUserStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if user solved any problem today
    const todaysSolutions = user.problemsSolved.filter(solved => {
      const solvedDate = new Date(solved.solvedAt);
      solvedDate.setHours(0, 0, 0, 0);
      return solvedDate.getTime() === today.getTime();
    });

    // Check if user solved any problem yesterday
    const yesterdaysSolutions = user.problemsSolved.filter(solved => {
      const solvedDate = new Date(solved.solvedAt);
      solvedDate.setHours(0, 0, 0, 0);
      return solvedDate.getTime() === yesterday.getTime();
    });

    let newStreak = user.currentStreak;
    let streakMessage = '';

    if (todaysSolutions.length > 0) {
      // User solved problem(s) today
      if (yesterdaysSolutions.length > 0 || user.currentStreak === 0) {
        // Continue streak or start new one
        if (user.currentStreak === 0) {
          newStreak = 1;
          streakMessage = 'Streak started! 🔥';
        } else {
          streakMessage = `Streak continues! ${newStreak} days 🔥`;
        }
      }
    } else {
      // User hasn't solved anything today
      const lastSolved = user.lastSolvedDate ? new Date(user.lastSolvedDate) : null;
      
      if (lastSolved) {
        lastSolved.setHours(0, 0, 0, 0);
        const daysSinceLastSolved = Math.floor((today - lastSolved) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLastSolved > 1) {
          // Streak is broken
          newStreak = 0;
          streakMessage = 'Streak broken! Start solving to rebuild it 💪';
        }
      }
    }

    // Update longest streak if current is longer
    const longestStreak = Math.max(user.longestStreak, newStreak);

    // Update user
    user.currentStreak = newStreak;
    user.longestStreak = longestStreak;
    await user.save();

    logger.info(`Streak updated for user ${user.username}: ${newStreak} days`);

    return {
      currentStreak: newStreak,
      longestStreak,
      message: streakMessage,
      todaysSolutions: todaysSolutions.length,
      canMaintainStreak: todaysSolutions.length > 0
    };
  } catch (error) {
    logger.error('Error updating user streak:', error);
    throw error;
  }
};

/**
 * Get user's streak statistics
 * @param {string} userId - User ID
 * @returns {Object} Streak statistics
 */
export const getUserStreakStats = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate streak history for the last 30 days
    const streakHistory = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const daysSolutions = user.problemsSolved.filter(solved => {
        const solvedDate = new Date(solved.solvedAt);
        solvedDate.setHours(0, 0, 0, 0);
        return solvedDate.getTime() === date.getTime();
      });

      streakHistory.push({
        date: date.toISOString().split('T')[0],
        problemsSolved: daysSolutions.length,
        hasSolved: daysSolutions.length > 0
      });
    }

    // Calculate current week stats
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const thisWeekSolutions = user.problemsSolved.filter(solved => {
      return new Date(solved.solvedAt) >= weekStart;
    });

    // Calculate this month stats
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthSolutions = user.problemsSolved.filter(solved => {
      return new Date(solved.solvedAt) >= monthStart;
    });

    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastSolvedDate: user.lastSolvedDate,
      streakHistory,
      thisWeek: {
        problemsSolved: thisWeekSolutions.length,
        daysActive: [...new Set(thisWeekSolutions.map(s => 
          new Date(s.solvedAt).toDateString()
        ))].length
      },
      thisMonth: {
        problemsSolved: thisMonthSolutions.length,
        daysActive: [...new Set(thisMonthSolutions.map(s => 
          new Date(s.solvedAt).toDateString()
        ))].length
      }
    };
  } catch (error) {
    logger.error('Error getting user streak stats:', error);
    throw error;
  }
};

/**
 * Get leaderboard with various sorting options
 * @param {Object} options - Leaderboard options
 * @returns {Array} Leaderboard data
 */
export const getLeaderboard = async (options = {}) => {
  try {
    const {
      type = 'streak',
      timeframe = 'all',
      limit = 10,
      offset = 0
    } = options;

    let sortCriteria = {};
    let matchCriteria = { isActive: true };

    // Set time range for submissions-based leaderboards
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate;

      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        matchCriteria.lastActive = { $gte: startDate };
      }
    }

    // Set sorting criteria
    switch (type) {
      case 'total':
        sortCriteria = { 
          totalSolved: -1,
          currentStreak: -1,
          longestStreak: -1
        };
        break;
      case 'easy':
        sortCriteria = { 'totalProblems.easy': -1, currentStreak: -1 };
        break;
      case 'medium':
        sortCriteria = { 'totalProblems.medium': -1, currentStreak: -1 };
        break;
      case 'hard':
        sortCriteria = { 'totalProblems.hard': -1, currentStreak: -1 };
        break;
      case 'longest_streak':
        sortCriteria = { longestStreak: -1, currentStreak: -1, totalSolved: -1 };
        break;
      case 'streak':
      default:
        sortCriteria = { currentStreak: -1, longestStreak: -1, totalSolved: -1 };
        break;
    }

    const leaderboard = await User.find(matchCriteria)
      .sort(sortCriteria)
      .skip(offset)
      .limit(limit)
      .select('discordId username avatar currentStreak longestStreak totalProblems lastActive joinedAt')
      .lean();

    // Add rank and additional stats
    const enrichedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: offset + index + 1,
      totalSolved: user.totalProblems.easy + user.totalProblems.medium + user.totalProblems.hard,
      score: calculateUserScore(user)
    }));

    return enrichedLeaderboard;
  } catch (error) {
    logger.error('Error getting leaderboard:', error);
    throw error;
  }
};

/**
 * Calculate user score based on problems solved
 * @param {Object} user - User data
 * @returns {number} Calculated score
 */
const calculateUserScore = (user) => {
  const { easy = 0, medium = 0, hard = 0 } = user.totalProblems || {};
  
  // Score weights
  const easyWeight = 1;
  const mediumWeight = 3;
  const hardWeight = 5;
  const streakBonus = user.currentStreak * 2;

  return (easy * easyWeight) + (medium * mediumWeight) + (hard * hardWeight) + streakBonus;
};

/**
 * Get user ranking in different categories
 * @param {string} userId - User ID
 * @returns {Object} User rankings
 */
export const getUserRankings = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const rankings = {};

    // Current streak ranking
    const streakRank = await User.countDocuments({
      isActive: true,
      $or: [
        { currentStreak: { $gt: user.currentStreak } },
        {
          currentStreak: user.currentStreak,
          longestStreak: { $gt: user.longestStreak }
        },
        {
          currentStreak: user.currentStreak,
          longestStreak: user.longestStreak,
          totalSolved: { $gt: user.totalSolved }
        }
      ]
    }) + 1;

    // Total problems ranking
    const totalRank = await User.countDocuments({
      isActive: true,
      $or: [
        { totalSolved: { $gt: user.totalSolved } },
        {
          totalSolved: user.totalSolved,
          currentStreak: { $gt: user.currentStreak }
        }
      ]
    }) + 1;

    // Longest streak ranking
    const longestStreakRank = await User.countDocuments({
      isActive: true,
      $or: [
        { longestStreak: { $gt: user.longestStreak } },
        {
          longestStreak: user.longestStreak,
          currentStreak: { $gt: user.currentStreak }
        },
        {
          longestStreak: user.longestStreak,
          currentStreak: user.currentStreak,
          totalSolved: { $gt: user.totalSolved }
        }
      ]
    }) + 1;

    return {
      currentStreak: streakRank,
      totalProblems: totalRank,
      longestStreak: longestStreakRank,
      totalUsers: await User.countDocuments({ isActive: true })
    };
  } catch (error) {
    logger.error('Error getting user rankings:', error);
    throw error;
  }
};

/**
 * Generate streak motivation message
 * @param {Object} streakData - Streak data
 * @returns {string} Motivation message
 */
export const generateStreakMessage = (streakData) => {
  const { currentStreak, longestStreak, todaysSolutions } = streakData;

  if (currentStreak === 0) {
    return "🚀 Ready to start your coding journey? Solve your first problem today!";
  }

  if (currentStreak === 1) {
    return "🔥 Great start! Keep going to build your streak!";
  }

  if (currentStreak < 7) {
    return `🔥 ${currentStreak} day streak! You're building momentum!`;
  }

  if (currentStreak < 30) {
    return `🔥🔥 ${currentStreak} day streak! You're on fire!`;
  }

  if (currentStreak < 100) {
    return `🔥🔥🔥 ${currentStreak} day streak! Absolutely incredible!`;
  }

  return `🏆🔥 ${currentStreak} day streak! You're a coding legend!`;
};

/**
 * Check if user needs streak reminder
 * @param {string} userId - User ID
 * @returns {Object} Reminder status
 */
export const checkStreakReminder = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.enableDailyReminders) {
      return { needsReminder: false };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user solved any problem today
    const todaysSolutions = user.problemsSolved.filter(solved => {
      const solvedDate = new Date(solved.solvedAt);
      solvedDate.setHours(0, 0, 0, 0);
      return solvedDate.getTime() === today.getTime();
    });

    const needsReminder = todaysSolutions.length === 0 && user.currentStreak > 0;

    return {
      needsReminder,
      currentStreak: user.currentStreak,
      reminderTime: user.reminderTime,
      message: needsReminder ? 
        `⏰ Don't break your ${user.currentStreak} day streak! Solve a problem today.` : 
        null
    };
  } catch (error) {
    logger.error('Error checking streak reminder:', error);
    throw error;
  }
};

/**
 * Get streak statistics for all active users
 * @returns {Object} Global streak statistics
 */
export const getGlobalStreakStats = async () => {
  try {
    const stats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          avgCurrentStreak: { $avg: '$currentStreak' },
          avgLongestStreak: { $avg: '$longestStreak' },
          maxCurrentStreak: { $max: '$currentStreak' },
          maxLongestStreak: { $max: '$longestStreak' },
          usersWithActiveStreak: {
            $sum: { $cond: [{ $gt: ['$currentStreak', 0] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalUsers: 0,
      avgCurrentStreak: 0,
      avgLongestStreak: 0,
      maxCurrentStreak: 0,
      maxLongestStreak: 0,
      usersWithActiveStreak: 0
    };

    // Calculate additional metrics
    result.streakPercentage = result.totalUsers > 0 ? 
      Math.round((result.usersWithActiveStreak / result.totalUsers) * 100) : 0;

    return result;
  } catch (error) {
    logger.error('Error getting global streak stats:', error);
    throw error;
  }
};

export default {
  updateUserStreak,
  getUserStreakStats,
  getLeaderboard,
  getUserRankings,
  generateStreakMessage,
  checkStreakReminder,
  getGlobalStreakStats
};