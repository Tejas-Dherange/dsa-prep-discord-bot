import axios from 'axios';
import Problem from '../models/Problem.js';
import { logger } from '../config/discordClient.js';

// LeetCode API endpoints
const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';
const LEETCODE_PROBLEMS_URL = 'https://leetcode.com/api/problems/all/';

/**
 * Fetch problem data from LeetCode
 * @param {string} titleSlug - The problem slug from LeetCode
 * @returns {Object} Problem data
 */
export const fetchLeetCodeProblem = async (titleSlug) => {
  try {
    const query = `
      query getProblem($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          title
          titleSlug
          content
          difficulty
          stats
          topicTags {
            name
          }
          sampleTestCase
          exampleTestcases
          constraints
          similarQuestions
        }
      }
    `;

    const response = await axios.post(LEETCODE_GRAPHQL_URL, {
      query,
      variables: { titleSlug }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DSA-Prep-Bot/1.0'
      }
    });

    if (response.data.errors) {
      throw new Error(`LeetCode API Error: ${response.data.errors[0].message}`);
    }

    return response.data.data.question;
  } catch (error) {
    logger.error(`Error fetching LeetCode problem ${titleSlug}:`, error);
    throw error;
  }
};

/**
 * Fetch all LeetCode problems list
 * @returns {Array} List of all problems
 */
export const fetchAllLeetCodeProblems = async () => {
  try {
    const response = await axios.get(LEETCODE_PROBLEMS_URL, {
      headers: {
        'User-Agent': 'DSA-Prep-Bot/1.0'
      }
    });

    return response.data.stat_status_pairs || [];
  } catch (error) {
    logger.error('Error fetching all LeetCode problems:', error);
    throw error;
  }
};

/**
 * Parse and clean LeetCode problem content
 * @param {Object} leetcodeProblem - Raw LeetCode problem data
 * @returns {Object} Cleaned problem data
 */
export const parseLeetCodeProblem = (leetcodeProblem) => {
  try {
    // Extract examples from content
    const examples = extractExamples(leetcodeProblem.content);
    
    // Parse constraints
    const constraints = extractConstraints(leetcodeProblem.content);
    
    // Clean description
    const description = cleanDescription(leetcodeProblem.content);
    
    // Map difficulty
    const difficultyMap = {
      'Easy': 'Easy',
      'Medium': 'Medium',
      'Hard': 'Hard'
    };

    return {
      title: leetcodeProblem.title,
      slug: leetcodeProblem.titleSlug,
      difficulty: difficultyMap[leetcodeProblem.difficulty] || 'Medium',
      description,
      examples,
      constraints,
      tags: leetcodeProblem.topicTags?.map(tag => tag.name) || [],
      leetcodeId: parseInt(leetcodeProblem.questionId),
      leetcodeUrl: `https://leetcode.com/problems/${leetcodeProblem.titleSlug}/`,
      source: 'leetcode',
      category: categorizeByTags(leetcodeProblem.topicTags?.map(tag => tag.name) || [])
    };
  } catch (error) {
    logger.error('Error parsing LeetCode problem:', error);
    throw error;
  }
};

/**
 * Extract examples from problem content
 * @param {string} content - HTML content from LeetCode
 * @returns {Array} Array of examples
 */
const extractExamples = (content) => {
  const examples = [];
  
  // Simple regex to extract examples (this is a basic implementation)
  const exampleRegex = /<strong>Example \d+:<\/strong>(.*?)(?=<strong>Example \d+:|<strong>Constraints:|$)/gs;
  let match;
  
  while ((match = exampleRegex.exec(content)) !== null) {
    const exampleContent = match[1];
    
    // Extract input and output
    const inputMatch = exampleContent.match(/<strong>Input:<\/strong>\s*(.*?)(?=<strong>Output:|$)/s);
    const outputMatch = exampleContent.match(/<strong>Output:<\/strong>\s*(.*?)(?=<strong>Explanation:|<strong>Example|$)/s);
    const explanationMatch = exampleContent.match(/<strong>Explanation:<\/strong>\s*(.*?)(?=<strong>Example|$)/s);
    
    if (inputMatch && outputMatch) {
      examples.push({
        input: cleanText(inputMatch[1]),
        output: cleanText(outputMatch[1]),
        explanation: explanationMatch ? cleanText(explanationMatch[1]) : ''
      });
    }
  }
  
  return examples;
};

/**
 * Extract constraints from problem content
 * @param {string} content - HTML content from LeetCode
 * @returns {Array} Array of constraints
 */
const extractConstraints = (content) => {
  const constraintsMatch = content.match(/<strong>Constraints:<\/strong>(.*?)(?=<\/div>|$)/s);
  
  if (!constraintsMatch) return [];
  
  const constraintsContent = constraintsMatch[1];
  const constraintsList = constraintsContent.match(/<li>(.*?)<\/li>/g);
  
  if (!constraintsList) {
    // Try different format
    const lines = constraintsContent.split('\n');
    return lines
      .map(line => cleanText(line))
      .filter(line => line.trim().length > 0);
  }
  
  return constraintsList.map(item => cleanText(item.replace(/<\/?li>/g, '')));
};

/**
 * Clean description by removing HTML tags and formatting
 * @param {string} content - HTML content
 * @returns {string} Clean description
 */
const cleanDescription = (content) => {
  // Remove everything after examples/constraints
  const mainContent = content.split(/<strong>Example/)[0];
  
  // Remove HTML tags
  let cleaned = mainContent.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&amp;/g, '&');
  
  // Clean up whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
};

/**
 * Clean text by removing HTML tags and formatting
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
const cleanText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Categorize problem based on tags
 * @param {Array} tags - Array of tag names
 * @returns {string} Primary category
 */
const categorizeByTags = (tags) => {
  const categoryMap = {
    'Array': ['Array'],
    'String': ['String'],
    'Linked List': ['Linked List'],
    'Stack': ['Stack'],
    'Queue': ['Queue'],
    'Tree': ['Tree', 'Binary Tree'],
    'Graph': ['Graph'],
    'Dynamic Programming': ['Dynamic Programming'],
    'Greedy': ['Greedy'],
    'Binary Search': ['Binary Search'],
    'Two Pointers': ['Two Pointers'],
    'Sliding Window': ['Sliding Window'],
    'Hash Table': ['Hash Table', 'Hash Map'],
    'Heap': ['Heap', 'Priority Queue'],
    'Trie': ['Trie'],
    'Math': ['Math', 'Mathematics'],
    'Bit Manipulation': ['Bit Manipulation'],
    'Backtracking': ['Backtracking'],
    'DFS': ['Depth-First Search', 'DFS'],
    'BFS': ['Breadth-First Search', 'BFS'],
    'Union Find': ['Union Find', 'Disjoint Set'],
    'Sorting': ['Sorting']
  };

  for (const [category, categoryTags] of Object.entries(categoryMap)) {
    if (tags.some(tag => categoryTags.includes(tag))) {
      return category;
    }
  }

  return 'Array'; // Default category
};

/**
 * Import LeetCode problem to database
 * @param {string} titleSlug - LeetCode problem slug
 * @returns {Object} Saved problem document
 */
export const importLeetCodeProblem = async (titleSlug) => {
  try {
    // Check if problem already exists
    const existingProblem = await Problem.findOne({ slug: titleSlug });
    if (existingProblem) {
      logger.info(`Problem ${titleSlug} already exists in database`);
      return existingProblem;
    }

    // Fetch from LeetCode
    const leetcodeProblem = await fetchLeetCodeProblem(titleSlug);
    
    // Parse and clean
    const problemData = parseLeetCodeProblem(leetcodeProblem);
    
    // Save to database
    const problem = await Problem.create(problemData);
    
    logger.info(`Successfully imported LeetCode problem: ${problem.title}`);
    return problem;
  } catch (error) {
    logger.error(`Error importing LeetCode problem ${titleSlug}:`, error);
    throw error;
  }
};

/**
 * Bulk import LeetCode problems
 * @param {Array} problemSlugs - Array of problem slugs to import
 * @param {number} delay - Delay between requests (ms)
 * @returns {Array} Array of import results
 */
export const bulkImportLeetCodeProblems = async (problemSlugs, delay = 1000) => {
  const results = [];
  
  for (const slug of problemSlugs) {
    try {
      const problem = await importLeetCodeProblem(slug);
      results.push({ slug, success: true, problem });
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      logger.error(`Failed to import ${slug}:`, error);
      results.push({ slug, success: false, error: error.message });
    }
  }
  
  return results;
};

/**
 * Generate custom DSA problem
 * @param {string} type - Type of problem to generate
 * @param {string} difficulty - Difficulty level
 * @returns {Object} Generated problem data
 */
export const generateCustomProblem = (type, difficulty = 'Medium') => {
  const templates = {
    'array': {
      'Easy': {
        title: 'Find Maximum Element',
        description: 'Given an array of integers, find and return the maximum element.',
        example: 'Input: [1, 5, 3, 9, 2]\nOutput: 9',
        tags: ['Array']
      },
      'Medium': {
        title: 'Subarray Sum Equals K',
        description: 'Given an array of integers and an integer k, find the total number of continuous subarrays whose sum equals k.',
        example: 'Input: nums = [1,1,1], k = 2\nOutput: 2',
        tags: ['Array', 'Hash Table']
      }
    },
    'string': {
      'Easy': {
        title: 'Reverse String',
        description: 'Write a function that reverses a string. The input string is given as an array of characters.',
        example: 'Input: ["h","e","l","l","o"]\nOutput: ["o","l","l","e","h"]',
        tags: ['String', 'Two Pointers']
      }
    }
  };

  const template = templates[type]?.[difficulty];
  if (!template) {
    throw new Error(`No template found for type: ${type}, difficulty: ${difficulty}`);
  }

  return {
    ...template,
    difficulty,
    category: type.charAt(0).toUpperCase() + type.slice(1),
    source: 'custom',
    createdBy: 'system'
  };
};

/**
 * Get random problems for daily challenge
 * @param {number} count - Number of problems to fetch
 * @param {Object} criteria - Filtering criteria
 * @returns {Array} Array of problems
 */
export const getRandomProblemsForDaily = async (count = 1, criteria = {}) => {
  try {
    const {
      difficulty,
      category,
      excludeIds = [],
      minAcceptanceRate = 0
    } = criteria;

    const query = {
      isActive: true,
      acceptanceRate: { $gte: minAcceptanceRate },
      _id: { $nin: excludeIds }
    };

    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;

    const problems = await Problem.aggregate([
      { $match: query },
      { $sample: { size: count } }
    ]);

    return problems;
  } catch (error) {
    logger.error('Error getting random problems for daily challenge:', error);
    throw error;
  }
};

export default {
  fetchLeetCodeProblem,
  fetchAllLeetCodeProblems,
  parseLeetCodeProblem,
  importLeetCodeProblem,
  bulkImportLeetCodeProblems,
  generateCustomProblem,
  getRandomProblemsForDaily
};