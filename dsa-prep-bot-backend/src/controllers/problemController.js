import Problem from '../models/Problem.js';
import { logger } from '../config/discordClient.js';
import { syncProblemsFromLeetCode, syncSpecificProblem } from '../utils/leetcodeSync.js';

// @desc    Get all problems
// @route   GET /api/problems
// @access  Public
export const getProblems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      difficulty,
      category,
      tags,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };
    
    // Filter by difficulty
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      query.tags = { $in: tagArray };
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    const problems = await Problem.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .select('-__v -approaches.code'); // Exclude large fields for list view

      console.log("✅✅✅✅ Problems",problems);
      
    const total = await Problem.countDocuments(query);

    res.status(200).json({
      success: true,
      data: problems,
      pagination: {
        current: options.page,
        pages: Math.ceil(total / options.limit),
        total,
        limit: options.limit
      }
    });
  } catch (error) {
    logger.error('Error in getProblems:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching problems',
      error: error.message
    });
  }
};

// @desc    Get single problem
// @route   GET /api/problems/:id
// @access  Public
export const getProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).select('-__v');
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    res.status(200).json({
      success: true,
      data: problem
    });
  } catch (error) {
    logger.error('Error in getProblem:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching problem',
      error: error.message
    });
  }
};

// @desc    Get problem by slug
// @route   GET /api/problems/slug/:slug
// @access  Public
export const getProblemBySlug = async (req, res) => {
  try {
    const problem = await Problem.findBySlug(req.params.slug);
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    res.status(200).json({
      success: true,
      data: problem
    });
  } catch (error) {
    logger.error('Error in getProblemBySlug:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching problem',
      error: error.message
    });
  }
};

// @desc    Create new problem
// @route   POST /api/problems
// @access  Public
export const createProblem = async (req, res) => {
  try {
    const problemData = {
      ...req.body,
      createdBy: req.body.createdBy || 'api'
    };

    const problem = await Problem.create(problemData);

    logger.info(`New problem created: ${problem.title} (${problem.difficulty})`);

    res.status(201).json({
      success: true,
      data: problem,
      message: 'Problem created successfully'
    });
  } catch (error) {
    logger.error('Error in createProblem:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Problem with this slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating problem',
      error: error.message
    });
  }
};

// @desc    Update problem
// @route   PUT /api/problems/:id
// @access  Public
export const updateProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    logger.info(`Problem updated: ${problem.title}`);

    res.status(200).json({
      success: true,
      data: problem,
      message: 'Problem updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateProblem:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating problem',
      error: error.message
    });
  }
};

// @desc    Delete problem
// @route   DELETE /api/problems/:id
// @access  Public
export const deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);

    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    logger.info(`Problem deleted: ${problem.title}`);

    res.status(200).json({
      success: true,
      message: 'Problem deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteProblem:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting problem',
      error: error.message
    });
  }
};

// @desc    Get random problem
// @route   GET /api/problems/random
// @access  Public
export const getRandomProblem = async (req, res) => {
  try {
    const { difficulty, category } = req.query;

    let problems;
    if (category) {
      problems = await Problem.getRandomByCategory(category, difficulty);
    } else if (difficulty) {
      problems = await Problem.getRandomByDifficulty(difficulty);
    } else {
      // Get completely random problem
      problems = await Problem.aggregate([
        { $match: { isActive: true } },
        { $sample: { size: 1 } }
      ]);
    }

    if (!problems || problems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No problems found with specified criteria'
      });
    }

    res.status(200).json({
      success: true,
      data: problems[0]
    });
  } catch (error) {
    logger.error('Error in getRandomProblem:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching random problem',
      error: error.message
    });
  }
};

// @desc    Get daily challenge
// @route   GET /api/problems/daily
// @access  Public
export const getDailyChallenge = async (req, res) => {
  try {
    const dailyProblem = await Problem.getDailyChallenge();
    
    if (!dailyProblem) {
      // If no daily challenge is set, get a random problem
      const randomProblems = await Problem.aggregate([
        { $match: { isActive: true } },
        { $sample: { size: 1 } }
      ]);
      
      if (randomProblems.length > 0) {
        const problem = randomProblems[0];
        // Mark as daily challenge
        await Problem.findByIdAndUpdate(problem._id, { 
          isDaily: true,
          lastPostedAt: new Date()
        });
        
        return res.status(200).json({
          success: true,
          data: problem,
          message: 'Random problem selected as daily challenge'
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'No problems available'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: dailyProblem
    });
  } catch (error) {
    logger.error('Error in getDailyChallenge:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching daily challenge',
      error: error.message
    });
  }
};

// @desc    Get trending problems
// @route   GET /api/problems/trending
// @access  Public
export const getTrendingProblems = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const trendingProblems = await Problem.getTrendingProblems(parseInt(limit));

    res.status(200).json({
      success: true,
      data: trendingProblems
    });
  } catch (error) {
    logger.error('Error in getTrendingProblems:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trending problems',
      error: error.message
    });
  }
};

// @desc    Get problem statistics
// @route   GET /api/problems/:id/stats
// @access  Public
export const getProblemStats = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    const stats = {
      totalSubmissions: problem.totalSubmissions,
      totalAccepted: problem.totalAccepted,
      acceptanceRate: problem.acceptanceRate,
      solveRate: problem.solveRate,
      popularityScore: problem.popularityScore,
      timesPosted: problem.timesPosted,
      lastPostedAt: problem.lastPostedAt,
      usersSolved: problem.usersSolved.length,
      difficulty: problem.difficulty,
      category: problem.category,
      tags: problem.tags
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error in getProblemStats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching problem stats',
      error: error.message
    });
  }
};

// @desc    Add hint to problem
// @route   POST /api/problems/:id/hints
// @access  Public
export const addHint = async (req, res) => {
  try {
    const { hint } = req.body;
    
    if (!hint) {
      return res.status(400).json({
        success: false,
        message: 'Hint is required'
      });
    }

    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
    }

    problem.addHint(hint);
    await problem.save();

    logger.info(`Hint added to problem: ${problem.title}`);

    res.status(200).json({
      success: true,
      data: problem,
      message: 'Hint added successfully'
    });
  } catch (error) {
    logger.error('Error in addHint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding hint',
      error: error.message
    });
  }
};

// @desc    Search problems
// @route   GET /api/problems/search
// @access  Public
export const searchProblems = async (req, res) => {
  try {
    const {
      q: searchTerm,
      difficulty,
      category,
      tags,
      limit = 20,
      page = 1
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const tagArray = tags ? (Array.isArray(tags) ? tags : tags.split(',')) : undefined;
    
    const problems = await Problem.searchProblems(searchTerm, {
      difficulty,
      category,
      tags: tagArray,
      limit: parseInt(limit),
      skip
    });

    res.status(200).json({
      success: true,
      data: problems,
      count: problems.length
    });
  } catch (error) {
    logger.error('Error in searchProblems:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching problems',
      error: error.message
    });
  }
};

// @desc    Sync problems from LeetCode
// @route   POST /api/problems/sync
// @access  Public
export const syncFromLeetCode = async (req, res) => {
  try {
    const { limit = 100 } = req.body;
    
    // Start the sync process
    const syncResults = await syncProblemsFromLeetCode(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: syncResults,
      message: `Sync completed: ${syncResults.synced} problems synced, ${syncResults.skipped} skipped, ${syncResults.errors} errors`
    });
  } catch (error) {
    logger.error('Error in syncFromLeetCode:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while syncing from LeetCode',
      error: error.message
    });
  }
};

// @desc    Sync specific problem from LeetCode
// @route   POST /api/problems/sync/:slug
// @access  Public
export const syncSpecificFromLeetCode = async (req, res) => {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: 'Problem slug is required'
      });
    }
    
    const problem = await syncSpecificProblem(slug);
    
    if (!problem) {
      return res.status(404).json({
        success: false,
        message: 'Problem not found on LeetCode or failed to sync'
      });
    }
    
    res.status(200).json({
      success: true,
      data: problem,
      message: 'Problem synced successfully'
    });
  } catch (error) {
    logger.error('Error in syncSpecificFromLeetCode:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while syncing specific problem',
      error: error.message
    });
  }
};