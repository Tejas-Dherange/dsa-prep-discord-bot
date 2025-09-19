import axios from 'axios';
import Problem from '../models/Problem.js';
import { logger } from '../config/discordClient.js';

/**
 * Fetches problem data from LeetCode GraphQL API
 * @param {string} titleSlug - LeetCode problem slug
 * @returns {Promise<Object>} - Problem data
 */
const fetchLeetCodeProblem = async (titleSlug) => {
  try {
    const query = `
      query problemsetQuestionList($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          questionFrontendId
          title
          titleSlug
          content
          difficulty
          topicTags {
            name
            slug
          }
          exampleTestcases
          constraints
          hints
          stats
          acRate
          freqBar
          isPaidOnly
        }
      }
    `;

    const response = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { titleSlug }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    return response.data.data.question;
  } catch (error) {
    logger.error(`Error fetching LeetCode problem ${titleSlug}:`, error);
    return null;
  }
};

/**
 * Fetches a list of problems from LeetCode
 * @param {number} limit - Number of problems to fetch
 * @param {number} skip - Number of problems to skip
 * @returns {Promise<Array>} - Array of problem slugs
 */
const fetchLeetCodeProblemList = async (limit = 50, skip = 0) => {
  try {
    const query = `
      query problemsetQuestionList($limit: Int!, $skip: Int!, $filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(
          categorySlug: ""
          limit: $limit
          skip: $skip
          filters: $filters
        ) {
          questions: data {
            questionFrontendId
            title
            titleSlug
            difficulty
            isPaidOnly
            topicTags {
              name
              slug
            }
            acRate
            freqBar
          }
        }
      }
    `;

    const response = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { 
        limit, 
        skip,
        filters: {}
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    return response.data.data.problemsetQuestionList.questions;
  } catch (error) {
    logger.error('Error fetching LeetCode problem list:', error);
    return [];
  }
};

/**
 * Converts LeetCode problem data to our Problem model format
 * @param {Object} leetcodeProblem - Raw LeetCode problem data
 * @returns {Object} - Formatted problem data
 */
const formatLeetCodeProblem = (leetcodeProblem) => {
  try {
    // Extract examples from content or test cases
    const examples = [];
    if (leetcodeProblem.exampleTestcases) {
      // Parse example test cases (this is a simplified parser)
      const testCases = leetcodeProblem.exampleTestcases.split('\n\n');
      testCases.forEach((testCase, index) => {
        const lines = testCase.trim().split('\n');
        if (lines.length >= 2) {
          examples.push({
            input: lines[0],
            output: lines[1],
            explanation: `Example ${index + 1}`
          });
        }
      });
    }

    // Parse content to extract description (remove HTML tags)
    let description = leetcodeProblem.content || leetcodeProblem.title;
    if (description) {
      description = description.replace(/<[^>]*>/g, '').trim();
      if (description.length > 1000) {
        description = description.substring(0, 1000) + '...';
      }
    }

    // Map LeetCode categories to our categories
    const categoryMapping = {
      'array': 'Array',
      'string': 'String',
      'linked-list': 'Linked List',
      'stack': 'Stack',
      'queue': 'Queue',
      'tree': 'Tree',
      'graph': 'Graph',
      'dynamic-programming': 'Dynamic Programming',
      'greedy': 'Greedy',
      'binary-search': 'Binary Search',
      'two-pointers': 'Two Pointers',
      'sliding-window': 'Sliding Window',
      'hash-table': 'Hash Table',
      'heap': 'Heap',
      'trie': 'Trie',
      'math': 'Math',
      'bit-manipulation': 'Bit Manipulation',
      'backtracking': 'Backtracking',
      'depth-first-search': 'DFS',
      'breadth-first-search': 'BFS',
      'union-find': 'Union Find',
      'sorting': 'Sorting'
    };

    // Determine primary category
    let category = 'Array'; // default
    if (leetcodeProblem.topicTags && leetcodeProblem.topicTags.length > 0) {
      const firstTag = leetcodeProblem.topicTags[0].slug;
      category = categoryMapping[firstTag] || leetcodeProblem.topicTags[0].name;
    }

    return {
      title: leetcodeProblem.title,
      slug: leetcodeProblem.titleSlug,
      difficulty: leetcodeProblem.difficulty,
      description: description,
      examples: examples,
      constraints: leetcodeProblem.constraints ? [leetcodeProblem.constraints] : [],
      tags: leetcodeProblem.topicTags ? leetcodeProblem.topicTags.map(tag => tag.name) : [],
      category: category,
      leetcodeId: parseInt(leetcodeProblem.questionFrontendId),
      leetcodeUrl: `https://leetcode.com/problems/${leetcodeProblem.titleSlug}/`,
      hints: leetcodeProblem.hints || [],
      acceptanceRate: leetcodeProblem.acRate ? parseFloat(leetcodeProblem.acRate) : 0,
      isPremium: leetcodeProblem.isPaidOnly || false,
      isActive: !leetcodeProblem.isPaidOnly, // Only activate free problems
      source: 'leetcode',
      createdBy: 'leetcode-sync'
    };
  } catch (error) {
    logger.error('Error formatting LeetCode problem:', error);
    return null;
  }
};

/**
 * Syncs problems from LeetCode to the database
 * @param {number} limit - Number of problems to sync
 * @returns {Promise<Object>} - Sync results
 */
export const syncProblemsFromLeetCode = async (limit = 100) => {
  try {
    logger.info(`Starting LeetCode sync for ${limit} problems`);
    
    const problems = await fetchLeetCodeProblemList(limit);
    const results = {
      total: problems.length,
      synced: 0,
      skipped: 0,
      errors: 0
    };

    for (const problem of problems) {
      try {
        // Check if problem already exists
        const existingProblem = await Problem.findOne({ 
          leetcodeId: parseInt(problem.questionFrontendId) 
        });

        if (existingProblem) {
          results.skipped++;
          continue;
        }

        // Format and save the problem
        const formattedProblem = formatLeetCodeProblem(problem);
        if (formattedProblem) {
          await Problem.create(formattedProblem);
          results.synced++;
          logger.info(`Synced problem: ${problem.title}`);
        } else {
          results.errors++;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        logger.error(`Error syncing problem ${problem.title}:`, error);
        results.errors++;
      }
    }

    logger.info(`LeetCode sync completed: ${results.synced} synced, ${results.skipped} skipped, ${results.errors} errors`);
    return results;

  } catch (error) {
    logger.error('Error in LeetCode sync:', error);
    throw error;
  }
};

/**
 * Syncs a specific problem by slug
 * @param {string} titleSlug - LeetCode problem slug
 * @returns {Promise<Object>} - Created problem or null
 */
export const syncSpecificProblem = async (titleSlug) => {
  try {
    const leetcodeProblem = await fetchLeetCodeProblem(titleSlug);
    if (!leetcodeProblem) {
      return null;
    }

    const formattedProblem = formatLeetCodeProblem(leetcodeProblem);
    if (!formattedProblem) {
      return null;
    }

    // Check if problem already exists
    const existingProblem = await Problem.findOne({ 
      leetcodeId: parseInt(leetcodeProblem.questionFrontendId) 
    });

    if (existingProblem) {
      return existingProblem;
    }

    const newProblem = await Problem.create(formattedProblem);
    logger.info(`Synced specific problem: ${newProblem.title}`);
    return newProblem;

  } catch (error) {
    logger.error(`Error syncing specific problem ${titleSlug}:`, error);
    return null;
  }
};