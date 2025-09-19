import User from '../models/User.js';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { logger } from '../config/discordClient.js';
import { getDiscordActiveUsers, getDiscordBotStatus, getDiscordGuildInfo } from '../utils/discordUtils.js';
import { postDailyChallenge } from '../bot/jobs/dailyChallenge.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Public
export const getDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalProblems = await Problem.countDocuments({ isActive: true });
    const totalSubmissions = await Submission.countDocuments();
    
    // Get active users from Discord instead of database
    const discordStats = await getDiscordActiveUsers();
    const activeUsers = discordStats.activeUsers;
    const discordGuildInfo = await getDiscordGuildInfo();

    // Define date ranges for calculations
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get problems solved today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const problemsSolvedToday = await Submission.countDocuments({
      status: 'Accepted',
      submissionTime: { $gte: today, $lt: tomorrow }
    });

    // Calculate user growth (last 30 days vs previous 30 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const usersLast30Days = await User.countDocuments({
      joinedAt: { $gte: thirtyDaysAgo }
    });
    const usersPrevious30Days = await User.countDocuments({
      joinedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });
    
    const userGrowth = usersPrevious30Days > 0 
      ? ((usersLast30Days - usersPrevious30Days) / usersPrevious30Days * 100).toFixed(1)
      : 0;

    // Calculate submission growth
    const submissionsLast30Days = await Submission.countDocuments({
      submissionTime: { $gte: thirtyDaysAgo }
    });
    const submissionsPrevious30Days = await Submission.countDocuments({
      submissionTime: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });
    
    const submissionGrowth = submissionsPrevious30Days > 0 
      ? ((submissionsLast30Days - submissionsPrevious30Days) / submissionsPrevious30Days * 100).toFixed(1)
      : 0;

    // Get top solvers
    const topSolvers = await User.find({ isActive: true })
      .sort({ totalSolved: -1, currentStreak: -1 })
      .limit(5)
      .select('username discordId avatar totalSolved currentStreak totalProblems');

    // Get recent activity
    const recentActivity = await Submission.find({
      submissionTime: { $gte: thirtyDaysAgo }
    })
      .populate('userId', 'username discordId avatar')
      .populate('problemId', 'title difficulty slug')
      .sort({ submissionTime: -1 })
      .limit(10)
      .select('status submissionTime userId problemId');

    // Transform recent activity to match frontend format
    const transformedActivity = recentActivity.map(activity => ({
      type: activity.status === 'Accepted' ? 'problem_solved' : 'submission_made',
      user: activity.userId,
      problem: activity.problemId,
      timestamp: activity.submissionTime
    }));

    // Add user join events to recent activity
    const recentUsers = await User.find({
      joinedAt: { $gte: thirtyDaysAgo }
    })
      .sort({ joinedAt: -1 })
      .limit(5)
      .select('username discordId avatar joinedAt');

    const userJoinEvents = recentUsers.map(user => ({
      type: 'user_joined',
      user: user,
      timestamp: user.joinedAt
    }));

    // Combine and sort all recent activity
    const allRecentActivity = [...transformedActivity, ...userJoinEvents]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    // Get difficulty distribution
    const difficultyStats = await Problem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get language statistics
    const languageStats = await Submission.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const stats = {
      totalUsers,
      totalProblems,
      totalSubmissions,
      activeUsers,
      problemsSolvedToday,
      userGrowth: parseFloat(userGrowth),
      submissionGrowth: parseFloat(submissionGrowth),
      topSolvers: topSolvers.map(user => ({
        user: {
          _id: user._id,
          username: user.username,
          discordId: user.discordId,
          avatar: user.avatar
        },
        problemsSolved: user.totalSolved
      })),
      recentActivity: allRecentActivity,
      difficultyStats,
      languageStats,
      // Discord-specific stats
      discordStats: {
        online: discordStats.online,
        idle: discordStats.idle,
        dnd: discordStats.dnd,
        offline: discordStats.offline,
        totalMembers: discordStats.total,
        guildInfo: discordGuildInfo
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard stats',
      error: error.message
    });
  }
};

// @desc    Get system health
// @route   GET /api/dashboard/health
// @access  Public
export const getSystemHealth = async (req, res) => {
  try {
    const dbStatus = 'connected'; // Can be enhanced with actual DB health check
    const discordBotStatus = await getDiscordBotStatus();
    
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    const health = {
      status: 'healthy',
      uptime: Math.floor(uptime),
      database: dbStatus,
      discordBot: {
        status: discordBotStatus.isReady ? 'online' : 'offline',
        uptime: discordBotStatus.uptime,
        ping: discordBotStatus.ping,
        guilds: discordBotStatus.guilds,
        users: discordBotStatus.users,
        channels: discordBotStatus.channels,
        botStatus: discordBotStatus.status
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024)
      },
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error('Error in getSystemHealth:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching system health',
      error: error.message
    });
  }
};

// @desc    Trigger daily challenge manually
// @route   POST /api/dashboard/daily-challenge/trigger
// @access  Public
export const triggerDailyChallenge = async (req, res) => {
  try {
    logger.info('Manual daily challenge trigger requested');
    
    // Call the daily challenge function
    await postDailyChallenge();
    
    res.status(200).json({
      success: true,
      message: 'Daily challenge posted successfully!',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error triggering daily challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post daily challenge',
      error: error.message
    });
  }
};