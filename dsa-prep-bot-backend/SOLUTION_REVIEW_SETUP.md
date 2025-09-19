# DSA Solution Review System Setup Guide

## 🚀 Quick Setup

### 1. Get Your Solution Channel ID

1. Go to your Discord server
2. Right-click on the channel where you want solution reviews (e.g., "#solutions" or "#daily-challenge-solutions")
3. Click "Copy Channel ID" (you need Developer Mode enabled)
4. Update your `.env` file:

```env
SOLUTION_REVIEW_CHANNEL_ID=your_actual_channel_id_here
```

### 2. Test the System

1. Start your bot: `npm run dev`
2. Go to your solution review channel
3. Post a test message like:

```
Here's my solution for Two Sum:

```python
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
```

Problem: Two Sum
```

4. The bot should:
   - React with ⏳ (processing)
   - Analyze your code with AI
   - Reply with a detailed review
   - React with ✅ when done
   - Add score-based reactions (🎉, 👍, 💡, etc.)

## 🤖 How It Works

### Message Processing
- Bot listens to messages in the designated channel
- Extracts code blocks (```language code ```)
- Identifies the problem being solved
- Sends code to AI for review

### AI Review Features
- **Correctness Analysis**: Does the solution work?
- **Complexity Analysis**: Time/Space complexity evaluation
- **Code Quality**: Style, readability, best practices
- **Edge Cases**: Proper handling of corner cases
- **Optimization Suggestions**: Better approaches
- **Scoring**: 1-10 rating system

### Database Tracking
- Saves all submissions to MongoDB
- Tracks user statistics
- Links submissions to problems
- Stores full AI reviews

## 📊 Commands Available

### `/solution help`
Shows how to submit solutions

### `/solution stats`
Shows your submission statistics:
- Total submissions
- Success rate
- Average score
- Top languages used

### `/solution recent [limit]`
Shows your recent reviews

## 🎯 Scoring System

- **🎉 8-10**: Excellent solution (green)
- **👍 6-7**: Good solution (orange)  
- **💡 4-5**: Needs improvement (yellow)
- **🔄 1-3**: Major issues (red)

## 🔧 Configuration Options

Edit `src/bot/config/solutionConfig.js` to customize:

- **MAX_CODE_LENGTH**: Maximum characters (default: 5000)
- **REVIEW_TIMEOUT**: AI response timeout (default: 30s)
- **SUPPORTED_LANGUAGES**: Syntax highlighting languages
- **SCORE_REACTIONS**: Custom reactions for different scores
- **MESSAGES**: Custom response messages

## 🐛 Troubleshooting

### Bot Not Responding
1. Check if `SOLUTION_REVIEW_CHANNEL_ID` is correct
2. Ensure bot has permissions in the channel
3. Verify GEMINI_API_KEY is valid
4. Check server logs for errors

### AI Reviews Not Working
1. Check GEMINI_API_KEY in `.env`
2. Verify internet connection
3. Check API rate limits
4. Review error logs

### Code Not Detected
- Use proper code blocks: ```language
- Include problem name or LeetCode link
- Check supported languages list

## 🚀 Next Steps

1. **Custom Prompts**: Modify AI prompts in `solutionValidator.js`
2. **Additional Languages**: Add more programming languages
3. **Custom Scoring**: Implement domain-specific scoring
4. **Integration**: Connect with LeetCode API for auto-detection
5. **Leaderboards**: Create weekly/monthly solution contests

## 📝 Example Messages

### Python Solution
```
My solution for Maximum Subarray:

```python
def maxSubArray(nums):
    max_sum = current_sum = nums[0]
    for num in nums[1:]:
        current_sum = max(num, current_sum + num)
        max_sum = max(max_sum, current_sum)
    return max_sum
```

Problem: Maximum Subarray
```

### JavaScript Solution
```
Two Sum solution:

```javascript
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}
```

https://leetcode.com/problems/two-sum/
```

Your AI DSA Solution Review System is ready! 🎉