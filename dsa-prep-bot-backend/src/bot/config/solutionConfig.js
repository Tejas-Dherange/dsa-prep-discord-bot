// Solution Review Configuration
export const SOLUTION_CONFIG = {
  // Channel where users submit solutions for review
  REVIEW_CHANNEL_ID: process.env.SOLUTION_REVIEW_CHANNEL_ID || 'your_solution_channel_id_here',
  
  // Supported programming languages for syntax highlighting
  SUPPORTED_LANGUAGES: [
    'python', 'javascript', 'java', 'cpp', 'c', 'csharp', 'go', 
    'rust', 'kotlin', 'swift', 'typescript', 'php', 'ruby'
  ],
  
  // AI Review Settings
  AI_SETTINGS: {
    MAX_CODE_LENGTH: 5000,      // Maximum characters in code block
    REVIEW_TIMEOUT: 30000,      // 30 seconds timeout for AI review
    MIN_SCORE: 1,               // Minimum score
    MAX_SCORE: 10,              // Maximum score
    MAX_FIELD_LENGTH: 900,      // Maximum characters per embed field (Discord limit is 1024)
    MAX_EMBED_SIZE: 5000,       // Maximum total embed size (Discord limit is 6000)
  },
  
  // Response messages
  MESSAGES: {
    NO_CODE: `🤖 **Hello!** I didn't find any code in your message.

**To get your DSA solution reviewed:**
1. Include your code in a code block using \`\`\`
2. Mention the problem name or include the LeetCode link
3. I'll analyze your solution and provide feedback!

**Example:**
\`\`\`python
def twoSum(nums, target):
    # Your solution here
    return []
\`\`\`

Problem: Two Sum`,

    NO_PROBLEM: `❌ **Problem not found!**

Please specify which problem you're solving:
- Mention the problem name (e.g., "Two Sum")
- Include the LeetCode URL
- Add the problem ID from our daily challenge

**Available problems:**
You can check recent daily challenges or use \`/solution help\` to learn more.`,

    PROCESSING: '⏳ Analyzing your solution...',
    ERROR: '❌ **Something went wrong while processing your solution.**\n\nOur AI reviewer is currently unavailable. Please try again later!',
    CODE_TOO_LONG: '❌ **Code is too long!** Please keep your solution under 5000 characters.',
  },
  
  // Score-based reactions
  SCORE_REACTIONS: {
    EXCELLENT: ['🎉', '⭐', '🏆'],  // 8-10
    GOOD: ['👍', '✨'],             // 6-7  
    FAIR: ['💡', '🔧'],             // 4-5
    POOR: ['🔄', '📚']              // 1-3
  }
};

// Helper function to get appropriate reactions based on score
export const getScoreReactions = (score) => {
  if (score >= 8) return SOLUTION_CONFIG.SCORE_REACTIONS.EXCELLENT;
  if (score >= 6) return SOLUTION_CONFIG.SCORE_REACTIONS.GOOD;
  if (score >= 4) return SOLUTION_CONFIG.SCORE_REACTIONS.FAIR;
  return SOLUTION_CONFIG.SCORE_REACTIONS.POOR;
};

// Helper function to get score color for embeds
export const getScoreColor = (score) => {
  if (score >= 8) return 0x00ff00; // Green
  if (score >= 6) return 0xffa500; // Orange
  if (score >= 4) return 0xffff00; // Yellow
  return 0xff0000; // Red
};