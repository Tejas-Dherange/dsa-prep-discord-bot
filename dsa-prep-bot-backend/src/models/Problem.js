import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
    index: true
  },
  description: {
    type: String,
    required: true
  },
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: [String],
  
  // Problem categorization
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    required: true,
    enum: [
      'Array', 'String', 'Linked List', 'Stack', 'Queue',
      'Tree', 'Graph', 'Dynamic Programming', 'Greedy',
      'Binary Search', 'Two Pointers', 'Sliding Window',
      'Hash Table', 'Heap', 'Trie', 'Math', 'Bit Manipulation',
      'Backtracking', 'DFS', 'BFS', 'Union Find', 'Sorting'
    ],
    index: true
  },
  subcategory: String,
  
  // External links
  leetcodeId: {
    type: Number,
    unique: true,
    sparse: true
  },
  leetcodeUrl: String,
  hackerrankUrl: String,
  codeforcesUrl: String,
  
  // Solution hints and approaches
  hints: [String],
  approaches: [{
    name: String,
    description: String,
    timeComplexity: String,
    spaceComplexity: String,
    code: String,
    language: String
  }],
  
  // Statistics
  acceptanceRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  totalSubmissions: {
    type: Number,
    default: 0
  },
  totalAccepted: {
    type: Number,
    default: 0
  },
  
  // Discord Bot specific
  timesPosted: {
    type: Number,
    default: 0
  },
  lastPostedAt: Date,
  usersSolved: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    solvedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: Number, // in minutes
    attempts: {
      type: Number,
      default: 1
    }
  }],
  
  // Content flags
  isActive: {
    type: Boolean,
    default: true
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  isDaily: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  createdBy: {
    type: String,
    default: 'system'
  },
  source: {
    type: String,
    enum: ['leetcode', 'hackerrank', 'codeforces', 'custom'],
    default: 'custom'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for solve rate
problemSchema.virtual('solveRate').get(function() {
  if (this.totalSubmissions === 0) return 0;
  return Math.round((this.totalAccepted / this.totalSubmissions) * 100);
});

// Virtual for difficulty score
problemSchema.virtual('difficultyScore').get(function() {
  const scores = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
  return scores[this.difficulty] || 1;
});

// Virtual for popularity score
problemSchema.virtual('popularityScore').get(function() {
  return this.usersSolved ? this.usersSolved.length : 0;
});

// Indexes for better query performance
problemSchema.index({ difficulty: 1, category: 1 });
problemSchema.index({ tags: 1 });
problemSchema.index({ isActive: 1, isPremium: 1 });
problemSchema.index({ createdAt: -1 });
problemSchema.index({ acceptanceRate: -1 });
problemSchema.index({ 'usersSolved.length': -1 });

// Instance methods
problemSchema.methods.markAsSolved = function(userId, timeSpent = 0, attempts = 1) {
  // Initialize usersSolved array if it doesn't exist
  if (!this.usersSolved) {
    this.usersSolved = [];
  }
  
  // Check if user already solved this problem
  const existingSolution = this.usersSolved.find(
    solved => solved.userId.toString() === userId.toString()
  );
  
  if (!existingSolution) {
    this.usersSolved.push({
      userId,
      timeSpent,
      attempts,
      solvedAt: new Date()
    });
    this.totalAccepted += 1;
  } else {
    // Update existing solution with better time if applicable
    if (timeSpent > 0 && timeSpent < existingSolution.timeSpent) {
      existingSolution.timeSpent = timeSpent;
    }
    existingSolution.attempts += attempts;
  }
  
  this.totalSubmissions += attempts;
  this.acceptanceRate = Math.round((this.totalAccepted / this.totalSubmissions) * 100);
};

problemSchema.methods.addHint = function(hint) {
  // Initialize hints array if it doesn't exist
  if (!this.hints) {
    this.hints = [];
  }
  
  if (!this.hints.includes(hint)) {
    this.hints.push(hint);
  }
};

problemSchema.methods.incrementPostedCount = function() {
  this.timesPosted += 1;
  this.lastPostedAt = new Date();
};

// Static methods
problemSchema.statics.getRandomByDifficulty = function(difficulty, excludeIds = []) {
  const query = {
    difficulty,
    isActive: true,
    _id: { $nin: excludeIds }
  };
  
  return this.aggregate([
    { $match: query },
    { $sample: { size: 1 } }
  ]);
};

problemSchema.statics.getRandomByCategory = function(category, difficulty = null, excludeIds = []) {
  const query = {
    category,
    isActive: true,
    _id: { $nin: excludeIds }
  };
  
  if (difficulty) {
    query.difficulty = difficulty;
  }
  
  return this.aggregate([
    { $match: query },
    { $sample: { size: 1 } }
  ]);
};

problemSchema.statics.getDailyChallenge = function() {
  return this.findOne({
    isDaily: true,
    isActive: true
  }).sort({ lastPostedAt: 1 });
};

problemSchema.statics.getTrendingProblems = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ popularityScore: -1, acceptanceRate: 1 })
    .limit(limit);
};

problemSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true });
};

problemSchema.statics.searchProblems = function(searchTerm, options = {}) {
  const {
    difficulty,
    category,
    tags,
    limit = 20,
    skip = 0
  } = options;
  
  const query = { isActive: true };
  
  if (searchTerm) {
    query.$or = [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ];
  }
  
  if (difficulty) query.difficulty = difficulty;
  if (category) query.category = category;
  if (tags && tags.length > 0) query.tags = { $in: tags };
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Pre-save middleware
problemSchema.pre('save', function(next) {
  // Generate slug if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // Calculate acceptance rate
  if (this.totalSubmissions > 0) {
    this.acceptanceRate = Math.round((this.totalAccepted / this.totalSubmissions) * 100);
  }
  
  next();
});

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;