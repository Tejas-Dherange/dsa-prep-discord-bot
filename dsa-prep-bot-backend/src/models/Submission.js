import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
    index: true
  },
  
  // Submission details
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: [
      'javascript', 'python', 'java', 'cpp', 'c',
      'csharp', 'go', 'rust', 'typescript', 'swift',
      'kotlin', 'scala', 'ruby', 'php', 'dart'
    ]
  },
  
  // Execution results
  status: {
    type: String,
    required: true,
    enum: [
      'Accepted',
      'Wrong Answer',
      'Time Limit Exceeded',
      'Memory Limit Exceeded',
      'Runtime Error',
      'Compilation Error',
      'Pending',
      'Judging'
    ],
    default: 'Pending'
  },
  
  // Performance metrics
  runtime: {
    type: Number, // in milliseconds
    default: null
  },
  memory: {
    type: Number, // in KB
    default: null
  },
  
  // Test cases
  totalTestCases: {
    type: Number,
    default: 0
  },
  passedTestCases: {
    type: Number,
    default: 0
  },
  failedTestCase: {
    input: String,
    expectedOutput: String,
    actualOutput: String,
    errorMessage: String
  },
  
  // Submission metadata
  submissionTime: {
    type: Date,
    default: Date.now,
    index: true
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  
  // Discord interaction
  discordMessageId: String,
  discordChannelId: String,
  submittedViaBot: {
    type: Boolean,
    default: false
  },
  
  // Code analysis
  complexity: {
    time: String, // e.g., "O(n log n)"
    space: String // e.g., "O(n)"
  },
  approach: String, // Brief description of the approach used
  
  // Feedback and notes
  userNotes: String,
  feedback: String,
  hints: [String],
  
  // Scoring (for contests or challenges)
  score: {
    type: Number,
    default: 0,
    min: 0
  },
  rank: Number,
  
  // Review status
  needsReview: {
    type: Boolean,
    default: false
  },
  reviewedBy: String,
  reviewNotes: String,
  
  // Flags
  isOptimal: {
    type: Boolean,
    default: false
  },
  isBestSubmission: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for success rate
submissionSchema.virtual('successRate').get(function() {
  if (this.totalTestCases === 0) return 0;
  return Math.round((this.passedTestCases / this.totalTestCases) * 100);
});

// Virtual for performance rating
submissionSchema.virtual('performanceRating').get(function() {
  if (this.status !== 'Accepted') return 0;
  
  let rating = 50; // Base rating
  
  // Bonus for fast runtime (this would need benchmarking data)
  if (this.runtime && this.runtime < 100) rating += 20;
  else if (this.runtime && this.runtime < 500) rating += 10;
  
  // Bonus for low memory usage
  if (this.memory && this.memory < 50000) rating += 15;
  else if (this.memory && this.memory < 100000) rating += 7;
  
  // Bonus for fewer attempts
  if (this.attemptNumber === 1) rating += 15;
  else if (this.attemptNumber <= 3) rating += 10;
  
  return Math.min(rating, 100);
});

// Indexes for better query performance
submissionSchema.index({ userId: 1, problemId: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ submissionTime: -1 });
submissionSchema.index({ userId: 1, status: 1, submissionTime: -1 });
submissionSchema.index({ problemId: 1, status: 1 });
submissionSchema.index({ language: 1, status: 1 });

// Instance methods
submissionSchema.methods.markAsAccepted = function(runtime, memory, testCasesPassed, totalTestCases) {
  this.status = 'Accepted';
  this.runtime = runtime;
  this.memory = memory;
  this.passedTestCases = testCasesPassed;
  this.totalTestCases = totalTestCases;
  
  // Check if this is the best submission for this user-problem combination
  return this.constructor.findOne({
    userId: this.userId,
    problemId: this.problemId,
    status: 'Accepted',
    _id: { $ne: this._id }
  }).then(bestSubmission => {
    if (!bestSubmission || 
        (this.runtime && (!bestSubmission.runtime || this.runtime < bestSubmission.runtime))) {
      this.isBestSubmission = true;
      
      // Mark previous best as not best
      if (bestSubmission) {
        bestSubmission.isBestSubmission = false;
        return bestSubmission.save();
      }
    }
  });
};

submissionSchema.methods.markAsFailed = function(status, failedTestCase = null) {
  this.status = status;
  if (failedTestCase) {
    this.failedTestCase = failedTestCase;
  }
};

submissionSchema.methods.addFeedback = function(feedback, reviewedBy = 'system') {
  this.feedback = feedback;
  this.reviewedBy = reviewedBy;
  this.needsReview = false;
};

// Static methods
submissionSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgRuntime: { $avg: '$runtime' },
        avgMemory: { $avg: '$memory' }
      }
    }
  ]);
};

submissionSchema.statics.getProblemStats = function(problemId) {
  return this.aggregate([
    { $match: { problemId: new mongoose.Types.ObjectId(problemId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgRuntime: { $avg: '$runtime' },
        avgMemory: { $avg: '$memory' }
      }
    }
  ]);
};

submissionSchema.statics.getLanguageStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$language',
        totalSubmissions: { $sum: 1 },
        acceptedSubmissions: {
          $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] }
        },
        avgRuntime: { $avg: '$runtime' },
        avgMemory: { $avg: '$memory' }
      }
    },
    {
      $addFields: {
        acceptanceRate: {
          $round: [
            { $multiply: [{ $divide: ['$acceptedSubmissions', '$totalSubmissions'] }, 100] },
            2
          ]
        }
      }
    },
    { $sort: { totalSubmissions: -1 } }
  ]);
};

submissionSchema.statics.getRecentSubmissions = function(userId, limit = 10) {
  return this.find({ userId })
    .populate('problemId', 'title difficulty category')
    .sort({ submissionTime: -1 })
    .limit(limit);
};

submissionSchema.statics.getBestSubmissions = function(userId, problemId = null) {
  const query = {
    userId,
    status: 'Accepted',
    isBestSubmission: true
  };
  
  if (problemId) {
    query.problemId = problemId;
  }
  
  return this.find(query)
    .populate('problemId', 'title difficulty category')
    .sort({ submissionTime: -1 });
};

submissionSchema.statics.getSubmissionHistory = function(userId, problemId) {
  return this.find({ userId, problemId })
    .sort({ submissionTime: -1 });
};

// Pre-save middleware
submissionSchema.pre('save', function(next) {
  // Auto-calculate score for accepted submissions
  if (this.status === 'Accepted' && this.score === 0) {
    let score = 100;
    
    // Deduct points for multiple attempts
    if (this.attemptNumber > 1) {
      score -= Math.min((this.attemptNumber - 1) * 10, 50);
    }
    
    // Bonus for optimal solutions
    if (this.isOptimal) {
      score += 20;
    }
    
    this.score = Math.max(score, 10); // Minimum 10 points for any accepted solution
  }
  
  next();
});

// Post-save middleware to update user and problem statistics
submissionSchema.post('save', async function(doc) {
  if (doc.status === 'Accepted') {
    try {
      // Update user statistics
      const User = mongoose.model('User');
      const user = await User.findById(doc.userId);
      if (user) {
        const problem = await mongoose.model('Problem').findById(doc.problemId);
        if (problem) {
          user.addSolvedProblem(doc.problemId, problem.difficulty, doc.timeSpent);
          await user.save();
        }
      }
      
      // Update problem statistics
      const problem = await mongoose.model('Problem').findById(doc.problemId);
      if (problem) {
        problem.markAsSolved(doc.userId, doc.timeSpent, doc.attemptNumber);
        await problem.save();
      }
    } catch (error) {
      console.error('Error updating statistics after submission:', error);
    }
  }
});

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;