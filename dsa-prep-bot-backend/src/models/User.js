import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  avatar: {
    type: String,
    default: null
  },
  
  // DSA Progress tracking
  problemsSolved: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    },
    solvedAt: {
      type: Date,
      default: Date.now
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard']
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0
    }
  }],
  
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  lastSolvedDate: {
    type: Date,
    default: null
  },
  
  // Statistics
  totalProblems: {
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 }
  },
  
  // Preferences
  preferredDifficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Mixed'],
    default: 'Mixed'
  },
  dailyGoal: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  
  // Notifications
  enableDailyReminders: {
    type: Boolean,
    default: true
  },
  reminderTime: {
    type: String,
    default: '10:00',
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format. Use HH:MM format.'
    }
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total problems solved
userSchema.virtual('totalSolved').get(function() {
  return this.totalProblems.easy + this.totalProblems.medium + this.totalProblems.hard;
});

// Virtual for completion rate
userSchema.virtual('completionRate').get(function() {
  const total = this.totalSolved;
  if (total === 0) return 0;
  return Math.round((total / 3000) * 100); // Assuming ~3000 total problems
});

// Indexes for better query performance
userSchema.index({ discordId: 1 });
userSchema.index({ currentStreak: -1 });
userSchema.index({ 'totalProblems.easy': -1, 'totalProblems.medium': -1, 'totalProblems.hard': -1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ createdAt: -1 });

// Instance methods
userSchema.methods.updateStreak = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastSolved = this.lastSolvedDate ? new Date(this.lastSolvedDate) : null;
  
  if (lastSolved) {
    lastSolved.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastSolved) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      this.currentStreak += 1;
    } else if (daysDiff > 1) {
      // Streak broken
      this.currentStreak = 1;
    }
    // If daysDiff === 0, it's the same day, don't change streak
  } else {
    // First problem solved
    this.currentStreak = 1;
  }
  
  // Update longest streak
  if (this.currentStreak > this.longestStreak) {
    this.longestStreak = this.currentStreak;
  }
  
  this.lastSolvedDate = new Date();
  this.lastActive = new Date();
};

userSchema.methods.addSolvedProblem = function(problemId, difficulty, timeSpent = 0) {
  // Add to solved problems array
  this.problemsSolved.push({
    problemId,
    difficulty,
    timeSpent,
    solvedAt: new Date()
  });
  
  // Update statistics
  switch(difficulty) {
    case 'Easy':
      this.totalProblems.easy += 1;
      break;
    case 'Medium':
      this.totalProblems.medium += 1;
      break;
    case 'Hard':
      this.totalProblems.hard += 1;
      break;
  }
  
  // Update streak
  this.updateStreak();
};

// Static methods
userSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ currentStreak: -1, totalSolved: -1 })
    .limit(limit)
    .select('discordId username currentStreak totalProblems avatar');
};

userSchema.statics.findByDiscordId = function(discordId) {
  return this.findOne({ discordId });
};

// Pre-save middleware
userSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

const User = mongoose.model('User', userSchema);

export default User;