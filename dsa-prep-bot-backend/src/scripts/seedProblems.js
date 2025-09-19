import mongoose from 'mongoose';
import Problem from '../models/Problem.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the backend root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedProblems = [
  {
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
      }
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    tags: ["Array", "Hash Table"],
    category: "Array",
    leetcodeId: 1,
    leetcodeUrl: "https://leetcode.com/problems/two-sum/",
    hints: [
      "A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Again, it's best to try out brute force solutions for just for completeness. It is from these brute force solutions that you can come up with optimizations.",
      "So, if we fix one of the numbers, say x, we have to scan the entire array to find the next number y which is value - x where value is the input parameter. Can we change our array somehow so that this search becomes faster?",
      "The second train of thought is, without changing the array, can we use additional space somehow? Like maybe a hash map to speed up the search?"
    ],
    acceptanceRate: 49.7,
    isActive: true,
    source: "leetcode"
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "Easy",
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: Open brackets must be closed by the same type of brackets. Open brackets must be closed in the correct order. Every close bracket has a corresponding open bracket of the same type.",
    examples: [
      {
        input: "s = \"()\"",
        output: "true",
        explanation: "The string contains valid parentheses."
      },
      {
        input: "s = \"()[]{}\"",
        output: "true",
        explanation: "All brackets are properly closed."
      },
      {
        input: "s = \"(]\"",
        output: "false",
        explanation: "Mismatched bracket types."
      }
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'."
    ],
    tags: ["String", "Stack"],
    category: "Stack",
    leetcodeId: 20,
    leetcodeUrl: "https://leetcode.com/problems/valid-parentheses/",
    hints: [
      "An interesting property about a valid parenthesis expression is that a sub-expression of a valid expression should also be a valid expression. (Not every sub-expression) e.g. { { } [ ] [ [ ] ] } is VALID expression { { } [ ] is VALID sub-expression { { } [ ] [ [ ] is NOT a valid sub-expression",
      "What if whenever we encounter a matching pair of parenthesis in the expression, we simply remove it from the expression? This would keep on shortening the expression. e.g. { { ( { } ) } } after removing { } we get { { ( ) } } after removing ( ) we get { { } } after removing { } we get { } after removing { } we get '' If we encounter any unbalanced parenthesis along the way, then the expression is not valid. Otherwise it is."
    ],
    acceptanceRate: 40.1,
    isActive: true,
    source: "leetcode"
  },
  {
    title: "Merge Two Sorted Lists",
    slug: "merge-two-sorted-lists",
    difficulty: "Easy",
    description: "You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists. Return the head of the merged linked list.",
    examples: [
      {
        input: "list1 = [1,2,4], list2 = [1,3,4]",
        output: "[1,1,2,3,4,4]",
        explanation: "The merged list is [1,1,2,3,4,4]."
      },
      {
        input: "list1 = [], list2 = []",
        output: "[]",
        explanation: "Both lists are empty."
      }
    ],
    constraints: [
      "The number of nodes in both lists is in the range [0, 50].",
      "-100 <= Node.val <= 100",
      "Both list1 and list2 are sorted in non-decreasing order."
    ],
    tags: ["Linked List", "Recursion"],
    category: "Linked List",
    leetcodeId: 21,
    leetcodeUrl: "https://leetcode.com/problems/merge-two-sorted-lists/",
    acceptanceRate: 62.4,
    isActive: true,
    source: "leetcode"
  },
  {
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    difficulty: "Easy",
    description: "You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock. Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    examples: [
      {
        input: "prices = [7,1,5,3,6,4]",
        output: "5",
        explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5."
      },
      {
        input: "prices = [7,6,4,3,1]",
        output: "0",
        explanation: "In this case, no transactions are done and the max profit = 0."
      }
    ],
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4"
    ],
    tags: ["Array", "Dynamic Programming"],
    category: "Array",
    leetcodeId: 121,
    leetcodeUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    acceptanceRate: 54.2,
    isActive: true,
    source: "leetcode"
  },
  {
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    difficulty: "Medium",
    description: "Given an integer array nums, find the subarray with the largest sum, and return its sum. A subarray is a contiguous non-empty sequence of elements within an array.",
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "The subarray [4,-1,2,1] has the largest sum 6."
      },
      {
        input: "nums = [1]",
        output: "1",
        explanation: "The subarray [1] has the largest sum 1."
      }
    ],
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4"
    ],
    tags: ["Array", "Divide and Conquer", "Dynamic Programming"],
    category: "Dynamic Programming",
    leetcodeId: 53,
    leetcodeUrl: "https://leetcode.com/problems/maximum-subarray/",
    hints: [
      "If you have figured out the O(n) solution, try coding another solution using the divide and conquer approach, which is more subtle."
    ],
    acceptanceRate: 50.1,
    isActive: true,
    source: "leetcode"
  },
  {
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    difficulty: "Easy",
    description: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    examples: [
      {
        input: "n = 2",
        output: "2",
        explanation: "There are two ways to climb to the top. 1. 1 step + 1 step 2. 2 steps"
      },
      {
        input: "n = 3",
        output: "3",
        explanation: "There are three ways to climb to the top. 1. 1 step + 1 step + 1 step 2. 1 step + 2 steps 3. 2 steps + 1 step"
      }
    ],
    constraints: [
      "1 <= n <= 45"
    ],
    tags: ["Math", "Dynamic Programming", "Memoization"],
    category: "Dynamic Programming",
    leetcodeId: 70,
    leetcodeUrl: "https://leetcode.com/problems/climbing-stairs/",
    hints: [
      "To reach nth step, what could have been your previous steps? (Think about the step sizes)"
    ],
    acceptanceRate: 51.5,
    isActive: true,
    source: "leetcode"
  },
  {
    title: "Binary Tree Inorder Traversal",
    slug: "binary-tree-inorder-traversal",
    difficulty: "Easy",
    description: "Given the root of a binary tree, return the inorder traversal of its nodes' values.",
    examples: [
      {
        input: "root = [1,null,2,3]",
        output: "[1,3,2]",
        explanation: "Inorder traversal: left -> root -> right"
      },
      {
        input: "root = []",
        output: "[]",
        explanation: "Empty tree"
      }
    ],
    constraints: [
      "The number of nodes in the tree is in the range [0, 100].",
      "-100 <= Node.val <= 100"
    ],
    tags: ["Stack", "Tree", "Depth-First Search", "Binary Tree"],
    category: "Tree",
    leetcodeId: 94,
    leetcodeUrl: "https://leetcode.com/problems/binary-tree-inorder-traversal/",
    hints: [
      "The recursive approach is straightforward. Can you do it iteratively?",
      "Try using a stack to simulate the recursion."
    ],
    acceptanceRate: 75.2,
    isActive: true,
    source: "leetcode"
  },
  {
    title: "Same Tree",
    slug: "same-tree",
    difficulty: "Easy",
    description: "Given the roots of two binary trees p and q, write a function to check if they are the same or not. Two binary trees are considered the same if they are structurally identical, and the nodes have the same value.",
    examples: [
      {
        input: "p = [1,2,3], q = [1,2,3]",
        output: "true",
        explanation: "Both trees are identical."
      },
      {
        input: "p = [1,2], q = [1,null,2]",
        output: "false",
        explanation: "Trees have different structure."
      }
    ],
    constraints: [
      "The number of nodes in both trees is in the range [0, 100].",
      "-10^4 <= Node.val <= 10^4"
    ],
    tags: ["Tree", "Depth-First Search", "Binary Tree"],
    category: "Tree",
    leetcodeId: 100,
    leetcodeUrl: "https://leetcode.com/problems/same-tree/",
    acceptanceRate: 58.9,
    isActive: true,
    source: "leetcode"
  },
  {
    title: "Symmetric Tree",
    slug: "symmetric-tree",
    difficulty: "Easy",
    description: "Given the root of a binary tree, check whether it is a mirror of itself (i.e., symmetric around its center).",
    examples: [
      {
        input: "root = [1,2,2,3,4,4,3]",
        output: "true",
        explanation: "The tree is symmetric."
      },
      {
        input: "root = [1,2,2,null,3,null,3]",
        output: "false",
        explanation: "The tree is not symmetric."
      }
    ],
    constraints: [
      "The number of nodes in the tree is in the range [1, 1000].",
      "-100 <= Node.val <= 100"
    ],
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree"],
    category: "Tree",
    leetcodeId: 101,
    leetcodeUrl: "https://leetcode.com/problems/symmetric-tree/",
    hints: [
      "Can you solve it both recursively and iteratively?"
    ],
    acceptanceRate: 54.7,
    isActive: true,
    source: "leetcode"
  },
  {
    title: "Maximum Depth of Binary Tree",
    slug: "maximum-depth-of-binary-tree",
    difficulty: "Easy",
    description: "Given the root of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
    examples: [
      {
        input: "root = [3,9,20,null,null,15,7]",
        output: "3",
        explanation: "The maximum depth is 3."
      },
      {
        input: "root = [1,null,2]",
        output: "2",
        explanation: "The maximum depth is 2."
      }
    ],
    constraints: [
      "The number of nodes in the tree is in the range [0, 10^4].",
      "-100 <= Node.val <= 100"
    ],
    tags: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree"],
    category: "Tree",
    leetcodeId: 104,
    leetcodeUrl: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    acceptanceRate: 73.9,
    isActive: true,
    source: "leetcode"
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing problems (optional - remove if you want to keep existing ones)
    // await Problem.deleteMany({});
    // console.log('🗑️ Cleared existing problems');

    // Insert seed problems
    const insertedProblems = [];
    
    for (const problemData of seedProblems) {
      try {
        // Check if problem already exists
        const existingProblem = await Problem.findOne({ 
          $or: [
            { slug: problemData.slug },
            { leetcodeId: problemData.leetcodeId }
          ]
        });

        if (existingProblem) {
          console.log(`⏭️  Skipped: ${problemData.title} (already exists)`);
          continue;
        }

        // Create new problem
        const problem = new Problem(problemData);
        await problem.save();
        insertedProblems.push(problem);
        console.log(`✅ Added: ${problem.title} (${problem.difficulty})`);
        
      } catch (error) {
        console.error(`❌ Error adding ${problemData.title}:`, error.message);
      }
    }

    console.log('\n🎉 Seed completed!');
    console.log(`📊 Total problems added: ${insertedProblems.length}`);
    console.log(`📚 Total problems in database: ${await Problem.countDocuments()}`);
    
    // Show breakdown by difficulty
    const easyCount = await Problem.countDocuments({ difficulty: 'Easy' });
    const mediumCount = await Problem.countDocuments({ difficulty: 'Medium' });
    const hardCount = await Problem.countDocuments({ difficulty: 'Hard' });
    
    console.log('\n📈 Difficulty breakdown:');
    console.log(`🟢 Easy: ${easyCount}`);
    console.log(`🟡 Medium: ${mediumCount}`);
    console.log(`🔴 Hard: ${hardCount}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the seed script
seedDatabase();