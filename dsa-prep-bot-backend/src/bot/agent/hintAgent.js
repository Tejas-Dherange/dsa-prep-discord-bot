import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../../config/discordClient.js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI-powered hint generation service using Google Gemini
 */
class HintAgent {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /**
   * Generate AI-powered hint based on problem and level
   * @param {Object} problem - Problem object from database
   * @param {number} level - Hint level (1-3)
   * @param {Object} userContext - Optional user context (previous attempts, etc.)
   * @returns {Promise<Object>} - Generated hint with additional metadata
   */
  async generateHint(problem, level, userContext = {}) {
    try {
      const prompt = this.buildHintPrompt(problem, level, userContext);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();

      // Parse the AI response to extract structured hint data
      const parsedHint = this.parseHintResponse(generatedText, level);

      logger.info(`AI hint generated for problem: ${problem.title}, level: ${level}`);
      
      return {
        success: true,
        hint: parsedHint,
        level,
        problemId: problem._id,
        generatedAt: new Date()
      };

    } catch (error) {
      logger.error('Error generating AI hint:', error);
      
      // Fallback to static hint if AI fails
      const fallbackHint = this.getFallbackHint(problem, level);
      
      return {
        success: false,
        hint: fallbackHint,
        level,
        problemId: problem._id,
        error: error.message,
        fallback: true,
        generatedAt: new Date()
      };
    }
  }

  /**
   * Build the prompt for AI hint generation
   * @param {Object} problem - Problem object
   * @param {number} level - Hint level (1-3)
   * @param {Object} userContext - User context
   * @returns {string} - Formatted prompt for AI
   */
  buildHintPrompt(problem, level, userContext) {
    const levelDescriptions = {
      1: "subtle and encouraging hint that guides thinking without giving away the solution",
      2: "more direct hint with approach suggestions and key insights",
      3: "detailed hint with specific algorithmic approach and complexity analysis"
    };

    const basePrompt = `
You are an expert coding mentor helping students learn Data Structures and Algorithms.

PROBLEM DETAILS:
- Title: ${problem.title}
- Difficulty: ${problem.difficulty}
- Topics: ${problem.topicTags?.join(', ') || 'General'}
- Description: ${problem.description || 'No description available'}

HINT LEVEL: ${level} (${levelDescriptions[level]})

USER CONTEXT:
${userContext.previousAttempts ? `- Previous attempts: ${userContext.previousAttempts}` : '- First time asking for hints'}
${userContext.strugglingAreas ? `- Struggling with: ${userContext.strugglingAreas}` : ''}

INSTRUCTIONS:
Generate a ${levelDescriptions[level]} for this problem. Format your response as follows:

**HINT_TEXT:**
[Your main hint text here - be encouraging and educational]

**APPROACH_SUGGESTION:**
[Optional: Only for level 2+. Suggest a general approach without giving code]

**KEY_INSIGHTS:**
[Optional: Only for level 3. Provide key algorithmic insights]

**COMPLEXITY_TARGETS:**
[Optional: Only for level 3. Expected time and space complexity]

**FOLLOW_UP:**
[Optional: Suggest what to try next or think about]

Guidelines:
- Be encouraging and supportive
- Don't give direct code solutions
- Focus on building understanding
- Use analogies when helpful
- Consider the problem difficulty level
- Avoid spoiling the solution for other similar problems
`;

    return basePrompt;
  }

  /**
   * Parse AI response into structured hint object
   * @param {string} response - AI generated response
   * @param {number} level - Hint level
   * @returns {Object} - Parsed hint object
   */
  parseHintResponse(response, level) {
    const sections = {
      text: '',
      approach: null,
      keyInsights: null,
      complexity: null,
      followUp: null
    };

    try {
      // Ensure we have a valid response
      if (!response || typeof response !== 'string' || response.trim().length === 0) {
        sections.text = "I'm having trouble generating a hint right now. Please try again or consider the problem's constraints and examples.";
        return sections;
      }

      const trimmedResponse = response.trim();

      // Extract main hint text
      const hintMatch = trimmedResponse.match(/\*\*HINT_TEXT:\*\*\s*([\s\S]*?)(?:\*\*[A-Z_]+:\*\*|$)/);
      if (hintMatch && hintMatch[1].trim()) {
        sections.text = hintMatch[1].trim();
      } else {
        // Fallback: use entire response if structured format not found
        sections.text = trimmedResponse;
      }

      // Ensure text is not empty after extraction
      if (!sections.text || sections.text.trim().length === 0) {
        sections.text = "Here's a hint: Consider the problem step by step and think about what data structures or algorithms might be helpful.";
      }

      // Extract approach suggestion (level 2+)
      if (level >= 2) {
        const approachMatch = trimmedResponse.match(/\*\*APPROACH_SUGGESTION:\*\*\s*([\s\S]*?)(?:\*\*[A-Z_]+:\*\*|$)/);
        if (approachMatch && approachMatch[1].trim()) {
          sections.approach = approachMatch[1].trim();
        }
      }

      // Extract key insights (level 3)
      if (level >= 3) {
        const insightsMatch = trimmedResponse.match(/\*\*KEY_INSIGHTS:\*\*\s*([\s\S]*?)(?:\*\*[A-Z_]+:\*\*|$)/);
        if (insightsMatch && insightsMatch[1].trim()) {
          sections.keyInsights = insightsMatch[1].trim();
        }

        const complexityMatch = trimmedResponse.match(/\*\*COMPLEXITY_TARGETS:\*\*\s*([\s\S]*?)(?:\*\*[A-Z_]+:\*\*|$)/);
        if (complexityMatch && complexityMatch[1].trim()) {
          sections.complexity = complexityMatch[1].trim();
        }
      }

      // Extract follow-up
      const followUpMatch = trimmedResponse.match(/\*\*FOLLOW_UP:\*\*\s*([\s\S]*?)(?:\*\*[A-Z_]+:\*\*|$)/);
      if (followUpMatch && followUpMatch[1].trim()) {
        sections.followUp = followUpMatch[1].trim();
      }

    } catch (parseError) {
      logger.warn('Error parsing AI hint response:', parseError);
      // Fallback: return safe response
      sections.text = "I'm having some trouble parsing the hint response. Consider breaking down the problem into smaller steps.";
    }

    return sections;
  }

  /**
   * Generate follow-up hint based on user feedback
   * @param {Object} problem - Problem object
   * @param {string} userFeedback - User's feedback or question
   * @param {Array} previousHints - Previous hints given to user
   * @returns {Promise<Object>} - Follow-up hint
   */
  async generateFollowUpHint(problem, userFeedback, previousHints = []) {
    try {
      const prompt = `
You are a coding mentor providing follow-up guidance.

PROBLEM: ${problem.title} (${problem.difficulty})

PREVIOUS HINTS GIVEN:
${previousHints.map((hint, idx) => `${idx + 1}. ${hint.text}`).join('\n')}

USER FEEDBACK/QUESTION:
"${userFeedback}"

Generate a helpful follow-up response that:
- Addresses their specific question or concern
- Builds on previous hints without repeating them
- Guides them toward the solution without giving it away
- Maintains an encouraging tone

Keep the response concise and focused.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const followUpText = response.text();

      return {
        success: true,
        text: followUpText.trim(),
        type: 'followup',
        generatedAt: new Date()
      };

    } catch (error) {
      logger.error('Error generating follow-up hint:', error);
      return {
        success: false,
        text: "I understand you need more help! Try breaking down the problem into smaller steps, or consider what data structure might help you store and access information efficiently.",
        type: 'followup',
        fallback: true,
        error: error.message
      };
    }
  }

  /**
   * Analyze user's solution attempt and provide targeted hints
   * @param {Object} problem - Problem object
   * @param {string} attemptedCode - User's code attempt
   * @param {string} issueDescription - Description of the issue they're facing
   * @returns {Promise<Object>} - Targeted hint based on their attempt
   */
  async analyzeAndHint(problem, attemptedCode, issueDescription) {
    try {
      const prompt = `
You are a coding mentor analyzing a student's solution attempt.

PROBLEM: ${problem.title}
DIFFICULTY: ${problem.difficulty}

STUDENT'S CODE ATTEMPT:
\`\`\`
${attemptedCode}
\`\`\`

ISSUE DESCRIPTION:
"${issueDescription}"

Provide a helpful hint that:
- Identifies potential issues in their approach (without being too critical)
- Suggests improvements or corrections
- Guides them toward a working solution
- Maintains a supportive and educational tone

Focus on the specific issue they mentioned rather than rewriting their code.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisHint = response.text();

      return {
        success: true,
        text: analysisHint.trim(),
        type: 'code-analysis',
        generatedAt: new Date()
      };

    } catch (error) {
      logger.error('Error analyzing code attempt:', error);
      return {
        success: false,
        text: "I see you're working on the solution! Try reviewing your logic step by step, and consider testing with a small example to identify where things might be going wrong.",
        type: 'code-analysis',
        fallback: true,
        error: error.message
      };
    }
  }

  /**
   * Fallback hint when AI is unavailable
   * @param {Object} problem - Problem object
   * @param {number} level - Hint level
   * @returns {Object} - Static fallback hint
   */
  getFallbackHint(problem, level) {
    const fallbacks = {
      1: {
        text: `For "${problem.title}": Think about what information you need to keep track of as you process the input. What data structure would help you access that information quickly?`,
        approach: null,
        keyInsights: null,
        complexity: null,
        followUp: "Try working through a small example step by step."
      },
      2: {
        text: `For "${problem.title}": This ${problem.difficulty.toLowerCase()} problem often benefits from recognizing patterns in the data. Consider how the constraints might guide your approach.`,
        approach: "Break the problem into smaller subproblems and think about what helper data structures might be useful.",
        keyInsights: null,
        complexity: null,
        followUp: "Draw out an example and trace through your thought process."
      },
      3: {
        text: `For "${problem.title}": The key insight is understanding the relationship between the input constraints and optimal algorithm choice.`,
        approach: "Consider the time-space tradeoffs and choose the data structure that best fits the problem's requirements.",
        keyInsights: `Focus on ${problem.topicTags?.slice(0, 2).join(' and ') || 'efficient algorithms'}`,
        complexity: problem.timeComplexity || "Aim for better than brute force",
        followUp: "Implement a basic version first, then optimize."
      }
    };

    return fallbacks[level] || fallbacks[1];
  }
}

// Export singleton instance
export const hintAgent = new HintAgent();

export default {
  hintAgent,
  HintAgent
};