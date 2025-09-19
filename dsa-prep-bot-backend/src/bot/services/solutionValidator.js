import agent from '../agent/agent.js';
import Problem from '../../models/Problem.js';
import Submission from '../../models/Submission.js';
import User from '../../models/User.js';
import { logger } from '../../config/discordClient.js';
import { SOLUTION_CONFIG, getScoreColor } from '../config/solutionConfig.js';

/**
 * Extract code from Discord message
 * Supports code blocks with various formats
 */
const extractCodeFromMessage = (content) => {
  // Match code blocks with language specifiers
  const codeBlockPattern = /```(?:(\w+)\s*)?\n?([\s\S]*?)```/g;
  const inlineCodePattern = /`([^`]+)`/g;
  
  const codeBlocks = [];
  let match;
  
  // Extract code blocks
  while ((match = codeBlockPattern.exec(content)) !== null) {
    codeBlocks.push({
      language: match[1] || 'unknown',
      code: match[2].trim()
    });
  }
  
  // If no code blocks found, try inline code
  if (codeBlocks.length === 0) {
    while ((match = inlineCodePattern.exec(content)) !== null) {
      codeBlocks.push({
        language: 'unknown',
        code: match[1].trim()
      });
    }
  }
  
  return codeBlocks;
};

/**
 * Extract problem reference from message
 * Looks for problem ID, title, or LeetCode links
 */
const extractProblemReference = async (content) => {
  try {
    // Look for problem ID pattern (last 6 characters of MongoDB ObjectId)
    const problemIdPattern = /problem\s*id[:\s]*([a-f0-9]{6})/i;
    const idMatch = content.match(problemIdPattern);
    
    if (idMatch) {
      const problemId = idMatch[1];
      const problem = await Problem.findOne({
        _id: { $regex: problemId + '$' }
      });
      if (problem) return problem;
    }
    
    // Look for LeetCode URLs
    const leetcodePattern = /https?:\/\/leetcode\.com\/problems\/([^\/\s]+)/i;
    const urlMatch = content.match(leetcodePattern);
    
    if (urlMatch) {
      const slug = urlMatch[1];
      const problem = await Problem.findOne({ slug });
      if (problem) return problem;
    }
    
    // Look for problem title mentions
    const problems = await Problem.find({ isActive: true }).select('title slug');
    
    for (const problem of problems) {
      const titlePattern = new RegExp(problem.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (titlePattern.test(content)) {
        return await Problem.findById(problem._id);
      }
    }
    
    // If no specific problem found, get the most recent daily challenge
    const recentProblem = await Problem.findOne({ 
      lastPostedAt: { $exists: true } 
    }).sort({ lastPostedAt: -1 });
    
    return recentProblem;
    
  } catch (error) {
    logger.error('Error extracting problem reference:', error);
    return null;
  }
};

/**
 * Validate solution using AI agent
 */
const validateSolution = async (code, problem, language = 'unknown') => {
  try {
    const prompt = `
Please review this ${language} solution for the DSA problem "${problem.title}":

**Problem Description:**
${problem.description}

**Difficulty:** ${problem.difficulty}
**Category:** ${problem.category}

**Examples:**
${problem.examples ? problem.examples.map((ex, i) => 
  `Example ${i + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}\n${ex.explanation ? 'Explanation: ' + ex.explanation : ''}`
).join('\n\n') : 'No examples provided'}

**Constraints:**
${problem.constraints ? problem.constraints.join('\n') : 'No constraints provided'}

**Code to Review:**
\`\`\`${language}
${code}
\`\`\`

Please provide a comprehensive review including:
1. **Correctness**: Does the solution solve the problem correctly?
2. **Time Complexity**: What's the time complexity? Can it be optimized?
3. **Space Complexity**: What's the space complexity? Any optimizations possible?
4. **Code Quality**: Is the code clean, readable, and well-structured?
5. **Edge Cases**: Does it handle edge cases properly?
6. **Suggestions**: Any improvements or alternative approaches?
7. **Score**: Rate the solution from 1-10 (1=poor, 10=excellent)

Format your response in a clear, constructive manner suitable for learning.
`;

    const review = await agent.execute(prompt);
    return review;
    
  } catch (error) {
    logger.error('Error validating solution:', error);
    throw new Error('Failed to validate solution');
  }
};

/**
 * Split long text into multiple embed fields
 */
const splitReviewIntoFields = (review, maxLength = SOLUTION_CONFIG.AI_SETTINGS.MAX_FIELD_LENGTH) => {
  if (review.length <= maxLength) {
    return [{ name: '🎯 AI Review', value: review, inline: false }];
  }
  
  const fields = [];
  const sections = review.split('\n\n'); // Split by paragraphs
  let currentField = '';
  let fieldIndex = 1;
  
  for (const section of sections) {
    // If adding this section would exceed limit, create new field
    if (currentField.length + section.length + 2 > maxLength) {
      if (currentField.trim()) {
        fields.push({
          name: fieldIndex === 1 ? '🎯 AI Review' : `🎯 AI Review (Part ${fieldIndex})`,
          value: currentField.trim(),
          inline: false
        });
        fieldIndex++;
        currentField = '';
      }
    }
    
    currentField += (currentField ? '\n\n' : '') + section;
  }
  
  // Add remaining content
  if (currentField.trim()) {
    fields.push({
      name: fieldIndex === 1 ? '🎯 AI Review' : `🎯 AI Review (Part ${fieldIndex})`,
      value: currentField.trim(),
      inline: false
    });
  }
  
  // If still too long, truncate the last field
  if (fields.length > 0 && fields[fields.length - 1].value.length > maxLength) {
    const lastField = fields[fields.length - 1];
    lastField.value = lastField.value.substring(0, maxLength - 50) + '...\n\n*Review truncated. Full review saved to database.*';
  }
  
  return fields;
};

/**
 * Create review embed for Discord
 */
const createReviewEmbed = (user, problem, codeBlock, review, score = null) => {
  // Extract score from review if present
  const scoreMatch = review.match(/score[:\s]*(\d+(?:\.\d+)?)/i);
  const extractedScore = scoreMatch ? parseFloat(scoreMatch[1]) : score;
  
  // Determine color based on score
  const color = extractedScore ? getScoreColor(extractedScore) : 0x808080;
  
  // Create base fields
  const baseFields = [
    {
      name: '📋 Problem Details',
      value: `**Difficulty:** ${problem.difficulty}\n**Category:** ${problem.category}`,
      inline: true
    },
    {
      name: '💻 Language',
      value: codeBlock.language || 'Unknown',
      inline: true
    },
    {
      name: '📊 Score',
      value: extractedScore ? `${extractedScore}/10` : 'Not rated',
      inline: true
    }
  ];
  
  // Split review into multiple fields if needed
  const reviewFields = splitReviewIntoFields(review);
  
  // Combine all fields
  const allFields = [...baseFields, ...reviewFields];
  
  // Discord has a limit of 25 fields per embed, so we limit to first 10 fields max
  const limitedFields = allFields.slice(0, 10);
  
  return {
    color,
    title: `🔍 Solution Review: ${problem.title}`,
    author: {
      name: user.username,
      icon_url: user.displayAvatarURL({ dynamic: true })
    },
    fields: limitedFields,
    footer: {
      text: `Reviewed by AI Assistant • ${new Date().toLocaleString()}`,
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Save submission to database
 */
const saveSubmission = async (discordUser, problem, codeBlock, review, score = null) => {
  try {
    // Find or create user
    let user = await User.findOne({ discordId: discordUser.id });
    
    if (!user) {
      user = new User({
        discordId: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        avatar: discordUser.avatar,
        joinedAt: new Date()
      });
      await user.save();
    }
    
    // Create submission
    const submission = new Submission({
      userId: user._id,
      problemId: problem._id,
      code: codeBlock.code,
      language: codeBlock.language || 'unknown',
      status: score && score >= 7 ? 'Accepted' : 'Pending',
      submissionTime: new Date(),
      feedback: review,
      reviewedBy: 'AI Assistant',
      score: score || null
    });
    
    await submission.save();
    
    // Update user statistics if the submission was accepted
    if (submission.status === 'Accepted') {
      user.addSolvedProblem(problem._id, problem.difficulty, 0);
      await user.save();
    }
    
    logger.info(`Submission saved for user ${discordUser.username}, problem ${problem.title}`);
    return submission;
    
  } catch (error) {
    logger.error('Error saving submission:', error);
    throw error;
  }
};

export {
  extractCodeFromMessage,
  extractProblemReference,
  validateSolution,
  createReviewEmbed,
  saveSubmission,
  splitReviewIntoFields
};