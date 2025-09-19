import mongoose from 'mongoose';
import User from '../models/User.js';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Problem.deleteMany({});
    await Submission.deleteMany({});
    console.log('Cleared existing data');

    // Create test users with recent activity
    const users = [];
    const now = new Date();
    
    for (let i = 1; i <= 10; i++) {
      const daysAgo = Math.floor(Math.random() * 30); // Random activity within last 30 days
      const lastActive = new Date(now - (daysAgo * 24 * 60 * 60 * 1000));
      
      const user = new User({
        discordId: `test_user_${i}`,
        username: `TestUser${i}`,
        email: `testuser${i}@example.com`,
        avatar: `https://cdn.discordapp.com/avatars/${i}/avatar.png`,
        totalProblems: {
          easy: Math.floor(Math.random() * 50),
          medium: Math.floor(Math.random() * 30),
          hard: Math.floor(Math.random() * 10)
        },
        currentStreak: Math.floor(Math.random() * 15),
        longestStreak: Math.floor(Math.random() * 30),
        lastSolvedDate: lastActive,
        lastActive: lastActive,
        joinedAt: new Date(now - (Math.random() * 90 * 24 * 60 * 60 * 1000)) // Joined within last 90 days
      });
      
      users.push(user);
    }

    await User.insertMany(users);
    console.log('Created test users');

    // Create test problems
    const problems = [
      {
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        difficulty: 'Easy',
        tags: ['Array', 'Hash Table'],
        leetcodeUrl: 'https://leetcode.com/problems/two-sum/',
        problemNumber: 1,
        isActive: true,
        submissionCount: 1500,
        acceptanceRate: 45.2
      },
      {
        title: 'Add Two Numbers',
        description: 'You are given two non-empty linked lists representing two non-negative integers.',
        difficulty: 'Medium',
        tags: ['Linked List', 'Math', 'Recursion'],
        leetcodeUrl: 'https://leetcode.com/problems/add-two-numbers/',
        problemNumber: 2,
        isActive: true,
        submissionCount: 890,
        acceptanceRate: 32.8
      },
      {
        title: 'Median of Two Sorted Arrays',
        description: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.',
        difficulty: 'Hard',
        tags: ['Array', 'Binary Search', 'Divide and Conquer'],
        leetcodeUrl: 'https://leetcode.com/problems/median-of-two-sorted-arrays/',
        problemNumber: 4,
        isActive: true,
        submissionCount: 645,
        acceptanceRate: 28.5
      },
      {
        title: 'Longest Palindromic Substring',
        description: 'Given a string s, return the longest palindromic substring in s.',
        difficulty: 'Medium',
        tags: ['String', 'Dynamic Programming'],
        leetcodeUrl: 'https://leetcode.com/problems/longest-palindromic-substring/',
        problemNumber: 5,
        isActive: true,
        submissionCount: 720,
        acceptanceRate: 29.4
      },
      {
        title: 'Reverse Integer',
        description: 'Given a signed 32-bit integer x, return x with its digits reversed.',
        difficulty: 'Easy',
        tags: ['Math'],
        leetcodeUrl: 'https://leetcode.com/problems/reverse-integer/',
        problemNumber: 7,
        isActive: true,
        submissionCount: 980,
        acceptanceRate: 25.7
      }
    ];

    const createdProblems = await Problem.insertMany(problems);
    console.log('Created test problems');

    // Create test submissions
    const submissions = [];
    const statuses = ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error'];
    const languages = ['JavaScript', 'Python', 'Java', 'C++'];

    for (let i = 0; i < 50; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomProblem = createdProblems[Math.floor(Math.random() * createdProblems.length)];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const randomLanguage = languages[Math.floor(Math.random() * languages.length)];
      
      const daysAgo = Math.floor(Math.random() * 30);
      const submissionTime = new Date(now - (daysAgo * 24 * 60 * 60 * 1000));

      const submission = new Submission({
        userId: randomUser._id,
        problemId: randomProblem._id,
        code: `// Sample ${randomLanguage} code for ${randomProblem.title}\nfunction solution() {\n  // Implementation here\n  return result;\n}`,
        language: randomLanguage,
        status: randomStatus,
        runtime: randomStatus === 'Accepted' ? Math.floor(Math.random() * 100) + 10 : null,
        memory: randomStatus === 'Accepted' ? Math.floor(Math.random() * 50) + 10 : null,
        submissionTime: submissionTime,
        timeSpent: Math.floor(Math.random() * 120) + 5, // 5-125 minutes
        feedback: randomStatus !== 'Accepted' ? 'Check your algorithm logic and edge cases.' : null
      });

      submissions.push(submission);
    }

    await Submission.insertMany(submissions);
    console.log('Created test submissions');

    console.log('✅ Seed data created successfully!');
    console.log(`Created ${users.length} users, ${problems.length} problems, and ${submissions.length} submissions`);
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed script
seedData();