import User from '../models/User.js';
import { logger } from '../config/discordClient.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Public
export const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      isActive
    } = req.query;

    const query = {};
    
    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 },
      select: '-__v'
    };

    const users = await User.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        current: options.page,
        pages: Math.ceil(total / options.limit),
        total,
        limit: options.limit
      }
    });
  } catch (error) {
    logger.error('Error in getUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Public
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error in getUser:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: error.message
    });
  }
};

// @desc    Get user by Discord ID
// @route   GET /api/users/discord/:discordId
// @access  Public
export const getUserByDiscordId = async (req, res) => {
  try {
    const user = await User.findByDiscordId(req.params.discordId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Error in getUserByDiscordId:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: error.message
    });
  }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Public
export const createUser = async (req, res) => {
  try {
    const { discordId, username, email, avatar } = req.body;

    // Check if user already exists
    const existingUser = await User.findByDiscordId(discordId);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this Discord ID already exists'
      });
    }

    const user = await User.create({
      discordId,
      username,
      email,
      avatar
    });

    logger.info(`New user created: ${username} (${discordId})`);

    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    logger.error('Error in createUser:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User with this Discord ID or email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating user',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Public
export const updateUser = async (req, res) => {
  try {
    const allowedUpdates = [
      'username', 'email', 'avatar', 'preferredDifficulty',
      'dailyGoal', 'enableDailyReminders', 'reminderTime'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info(`User updated: ${user.username} (${user.discordId})`);

    res.status(200).json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateUser:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Public
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info(`User deleted: ${user.username} (${user.discordId})`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user',
      error: error.message
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Public
export const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const stats = {
      totalSolved: user.totalSolved,
      problemsSolved: user.totalProblems,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      completionRate: user.completionRate,
      joinedAt: user.joinedAt,
      lastActive: user.lastActive,
      recentSolved: user.problemsSolved.slice(-10).reverse() // Last 10 problems
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error in getUserStats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user stats',
      error: error.message
    });
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Public
export const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10, type = 'streak' } = req.query;

    let sortCriteria;
    switch (type) {
      case 'total':
        sortCriteria = { 
          'totalProblems.easy': -1, 
          'totalProblems.medium': -1, 
          'totalProblems.hard': -1 
        };
        break;
      case 'streak':
      default:
        sortCriteria = { currentStreak: -1, totalSolved: -1 };
        break;
    }

    const leaderboard = await User.find({ isActive: true })
      .sort(sortCriteria)
      .limit(parseInt(limit))
      .select('discordId username currentStreak longestStreak totalProblems avatar lastActive');

    res.status(200).json({
      success: true,
      data: leaderboard,
      type
    });
  } catch (error) {
    logger.error('Error in getLeaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching leaderboard',
      error: error.message
    });
  }
};

// @desc    Update user progress (for Discord bot)
// @route   POST /api/users/:id/progress
// @access  Public
export const updateUserProgress = async (req, res) => {
  try {
    const { problemId, difficulty, timeSpent } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.addSolvedProblem(problemId, difficulty, timeSpent);
    await user.save();

    logger.info(`Progress updated for user: ${user.username} - ${difficulty} problem solved`);

    res.status(200).json({
      success: true,
      data: {
        currentStreak: user.currentStreak,
        totalSolved: user.totalSolved,
        totalProblems: user.totalProblems
      },
      message: 'Progress updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateUserProgress:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating progress',
      error: error.message
    });
  }
};