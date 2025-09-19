import Submission from '../models/Submission.js';
import User from '../models/User.js';
import Problem from '../models/Problem.js';
import { logger } from '../config/discordClient.js';

// @desc    Get all submissions
// @route   GET /api/submissions
// @access  Public
export const getSubmissions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      problemId,
      status,
      language,
      sortBy = 'submissionTime',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    // Filter by user
    if (userId) {
      query.userId = userId;
    }
    
    // Filter by problem
    if (problemId) {
      query.problemId = problemId;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by language
    if (language) {
      query.language = language;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    const submissions = await Submission.find(query)
      .populate('userId', 'username discordId avatar')
      .populate('problemId', 'title difficulty category slug')
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .select('-code -__v'); // Exclude code for list view

    const total = await Submission.countDocuments(query);

    res.status(200).json({
      success: true,
      data: submissions,
      pagination: {
        current: options.page,
        pages: Math.ceil(total / options.limit),
        total,
        limit: options.limit
      }
    });
  } catch (error) {
    logger.error('Error in getSubmissions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submissions',
      error: error.message
    });
  }
};

// @desc    Get single submission
// @route   GET /api/submissions/:id
// @access  Public
export const getSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('userId', 'username discordId avatar')
      .populate('problemId', 'title difficulty category slug')
      .select('-__v');
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    logger.error('Error in getSubmission:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submission',
      error: error.message
    });
  }
};

// @desc    Create new submission
// @route   POST /api/submissions
// @access  Public
export const createSubmission = async (req, res) => {
  try {
    const {
      userId,
      problemId,
      code,
      language,
      timeSpent = 0,
      discordMessageId,
      discordChannelId
    } = req.body;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    // Count previous attempts for this user-problem combination
    const previousAttempts = await Submission.countDocuments({
      userId,
      problemId
    });

    const submission = await Submission.create({
      userId,
      problemId,
      code,
      language,
      timeSpent,
      attemptNumber: previousAttempts + 1,
      discordMessageId,
      discordChannelId,
      submittedViaBot: !!(discordMessageId && discordChannelId),
      status: 'Pending' // Will be updated by judge system
    });

    logger.info(`New submission created by user ${user.username} for problem ${problem.title}`);

    // Populate the response
    const populatedSubmission = await Submission.findById(submission._id)
      .populate('userId', 'username discordId avatar')
      .populate('problemId', 'title difficulty category slug');

    res.status(201).json({
      success: true,
      data: populatedSubmission,
      message: 'Submission created successfully'
    });
  } catch (error) {
    logger.error('Error in createSubmission:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating submission',
      error: error.message
    });
  }
};

// @desc    Update submission (for judge results)
// @route   PUT /api/submissions/:id
// @access  Public
export const updateSubmission = async (req, res) => {
  try {
    const {
      status,
      runtime,
      memory,
      totalTestCases,
      passedTestCases,
      failedTestCase,
      feedback,
      isOptimal
    } = req.body;

    const submission = await Submission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    // Update submission based on status
    if (status === 'Accepted') {
      await submission.markAsAccepted(runtime, memory, passedTestCases, totalTestCases);
    } else {
      submission.markAsFailed(status, failedTestCase);
    }

    // Update additional fields
    if (feedback) submission.feedback = feedback;
    if (isOptimal !== undefined) submission.isOptimal = isOptimal;

    await submission.save();

    logger.info(`Submission updated: ${submission._id} - Status: ${status}`);

    const populatedSubmission = await Submission.findById(submission._id)
      .populate('userId', 'username discordId avatar')
      .populate('problemId', 'title difficulty category slug');

    res.status(200).json({
      success: true,
      data: populatedSubmission,
      message: 'Submission updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateSubmission:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating submission',
      error: error.message
    });
  }
};

// @desc    Delete submission
// @route   DELETE /api/submissions/:id
// @access  Public
export const deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findByIdAndDelete(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    logger.info(`Submission deleted: ${submission._id}`);

    res.status(200).json({
      success: true,
      message: 'Submission deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteSubmission:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting submission',
      error: error.message
    });
  }
};

// @desc    Get user submissions
// @route   GET /api/submissions/user/:userId
// @access  Public
export const getUserSubmissions = async (req, res) => {
  try {
    const { limit = 10, status, language } = req.query;
    
    const query = { userId: req.params.userId };
    if (status) query.status = status;
    if (language) query.language = language;

    const submissions = await Submission.find(query)
      .populate('problemId', 'title difficulty category slug')
      .sort({ submissionTime: -1 })
      .limit(parseInt(limit))
      .select('-code -__v');

    res.status(200).json({
      success: true,
      data: submissions,
      count: submissions.length
    });
  } catch (error) {
    logger.error('Error in getUserSubmissions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user submissions',
      error: error.message
    });
  }
};

// @desc    Get problem submissions
// @route   GET /api/submissions/problem/:problemId
// @access  Public
export const getProblemSubmissions = async (req, res) => {
  try {
    const { limit = 10, status = 'Accepted' } = req.query;
    
    const submissions = await Submission.find({
      problemId: req.params.problemId,
      status
    })
      .populate('userId', 'username discordId avatar')
      .sort({ submissionTime: -1 })
      .limit(parseInt(limit))
      .select('-code -__v');

    res.status(200).json({
      success: true,
      data: submissions,
      count: submissions.length
    });
  } catch (error) {
    logger.error('Error in getProblemSubmissions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching problem submissions',
      error: error.message
    });
  }
};

// @desc    Get submission statistics
// @route   GET /api/submissions/stats
// @access  Public
export const getSubmissionStats = async (req, res) => {
  try {
    const { userId, problemId } = req.query;

    let stats;
    
    if (userId) {
      stats = await Submission.getUserStats(userId);
    } else if (problemId) {
      stats = await Submission.getProblemStats(problemId);
    } else {
      // Global stats
      stats = await Submission.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgRuntime: { $avg: '$runtime' },
            avgMemory: { $avg: '$memory' }
          }
        }
      ]);
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error in getSubmissionStats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submission stats',
      error: error.message
    });
  }
};

// @desc    Get language statistics
// @route   GET /api/submissions/stats/languages
// @access  Public
export const getLanguageStats = async (req, res) => {
  try {
    const stats = await Submission.getLanguageStats();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error in getLanguageStats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching language stats',
      error: error.message
    });
  }
};

// @desc    Get best submissions for a user
// @route   GET /api/submissions/user/:userId/best
// @access  Public
export const getUserBestSubmissions = async (req, res) => {
  try {
    const { problemId } = req.query;
    
    const bestSubmissions = await Submission.getBestSubmissions(
      req.params.userId,
      problemId
    );

    res.status(200).json({
      success: true,
      data: bestSubmissions,
      count: bestSubmissions.length
    });
  } catch (error) {
    logger.error('Error in getUserBestSubmissions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching best submissions',
      error: error.message
    });
  }
};

// @desc    Get submission history for a user-problem combination
// @route   GET /api/submissions/history/:userId/:problemId
// @access  Public
export const getSubmissionHistory = async (req, res) => {
  try {
    const { userId, problemId } = req.params;
    
    const history = await Submission.getSubmissionHistory(userId, problemId);

    res.status(200).json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    logger.error('Error in getSubmissionHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching submission history',
      error: error.message
    });
  }
};

// @desc    Add feedback to submission
// @route   POST /api/submissions/:id/feedback
// @access  Public
export const addSubmissionFeedback = async (req, res) => {
  try {
    const { feedback, reviewedBy = 'system' } = req.body;
    
    if (!feedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback is required'
      });
    }

    const submission = await Submission.findById(req.params.id);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    submission.addFeedback(feedback, reviewedBy);
    await submission.save();

    logger.info(`Feedback added to submission: ${submission._id}`);

    res.status(200).json({
      success: true,
      data: submission,
      message: 'Feedback added successfully'
    });
  } catch (error) {
    logger.error('Error in addSubmissionFeedback:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding feedback',
      error: error.message
    });
  }
};