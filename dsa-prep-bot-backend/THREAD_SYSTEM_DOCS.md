# Thread-per-User System Documentation

## Overview

The DSA Prep Bot now implements a **thread-per-user system** for both hints and solution reviews. This keeps conversations organized and prevents users from interfering with each other's learning process.

## 🧵 How It Works

### Hint System (`/hint` command)
- When a user types `/hint [problem] [level]`, the bot automatically creates a **private thread** in the hints channel
- Thread name: `"Hints for [Username]"`
- Only the user and moderators can see this thread
- All hints for that user stay in their personal thread
- Threads auto-archive after 24 hours of inactivity

### Solution Review System
- When a user posts code in the solution review channel, the bot creates a **private thread** for detailed reviews
- Thread name: `"Solutions for [Username]"`
- Full AI review is sent to the private thread
- A summary is posted in the main channel with a link to the thread
- Keeps the main channel clean while providing detailed feedback in private

## 📋 Commands

### `/hint` - Get Problem Hints
```bash
/hint problem:"Two Sum" level:1
/hint problem:"Longest Palindromic Substring" level:2
/hint problem:1 level:3  # Using LeetCode problem number
```

**Parameters:**
- `problem` (required): Problem name or LeetCode problem number
- `level` (optional, 1-3): 
  - **Level 1**: Subtle hints (default)
  - **Level 2**: Medium hints with approach suggestions
  - **Level 3**: Direct hints with detailed approach and complexity targets

**Example Usage:**
```
User: /hint problem:"Binary Search" level:2
Bot: Creates thread "Hints for UserA" with medium-level hints
```

### Solution Reviews (Automatic)
Simply post your code in the solution review channel:

```python
```python
def twoSum(nums, target):
    # Your solution here
    return []
```
Problem: Two Sum
```

The bot will:
1. Create/find your "Solutions for [Username]" thread
2. Send detailed AI review to your private thread
3. Post a summary in the main channel with thread link

## 🔧 Channel Setup

### Required Channels
1. **Hints Channel**: Where `/hint` commands create threads
   - Set `HINTS_CHANNEL_ID` in `.env` file
   - Or name channel with "hint" or "help" in the name
   
2. **Solution Review Channel**: Where code reviews happen
   - Already configured via `SOLUTION_CONFIG.REVIEW_CHANNEL_ID`

### Environment Variables
Add to your `.env` file:
```bash
HINTS_CHANNEL_ID=1234567890123456789  # Optional: specific hints channel
GUILD_ID=your_server_id_here          # For faster command deployment
```

## 🤖 Thread Management

### Automatic Cleanup
- **Auto-archive**: Threads automatically archive after 24 hours of inactivity
- **Scheduled Cleanup**: Bot runs cleanup every 6 hours to archive old threads
- **Smart Detection**: Only processes channels with "hints", "solutions", "help", etc. in the name

### Thread Lifecycle
1. **Creation**: User runs `/hint` or posts solution code
2. **Active**: Thread stays active while users interact
3. **Idle**: No messages for 24 hours
4. **Archived**: Thread becomes read-only but searchable

## 👥 User Experience

### For Students
- **Private Learning**: Get hints and reviews without others seeing
- **Organized History**: All your hints/reviews in one place per thread
- **No Interference**: Other users' questions don't mix with yours
- **Easy Access**: Threads appear in your sidebar when active

### For Moderators
- **Clean Channels**: Main channels stay uncluttered
- **Easy Monitoring**: Can access any user's thread if needed
- **Bulk Management**: Automatic cleanup keeps server organized

## 🚀 Benefits

### Organization
- ✅ No more mixed conversations
- ✅ Easy to track individual user progress
- ✅ Clean main channels
- ✅ Searchable history per user

### Privacy
- ✅ Private hints (only user + mods can see)
- ✅ Detailed solution reviews in private
- ✅ No spoilers for other users
- ✅ Safe learning environment

### Scalability
- ✅ Handles many users simultaneously
- ✅ Automatic cleanup prevents clutter
- ✅ No channel message limits reached
- ✅ Better server performance

## 🛠️ Technical Details

### Thread Creation
- **Type**: Private threads (type 12)
- **Duration**: 24-hour auto-archive
- **Permissions**: User + moderators only
- **Naming**: Consistent format for easy identification

### Error Handling
- **Fallback**: If thread creation fails, falls back to main channel
- **Graceful Degradation**: Bot continues working even with thread issues
- **Logging**: All thread operations logged for debugging

### Performance
- **Caching**: Existing threads are reused when possible
- **Rate Limiting**: Respects Discord's thread creation limits
- **Resource Management**: Old threads automatically archived

## 📊 Monitoring

### Logs
The bot logs thread operations:
```
[INFO] Created new Hints thread for user JohnDoe
[INFO] Thread cleanup completed. Archived 5 threads total.
[INFO] Solution review completed for Alice in thread
```

### Dashboard Integration
Thread statistics could be added to the admin dashboard:
- Active threads count
- Threads created per day
- Most active users in threads
- Cleanup statistics

## 🔧 Configuration Options

### Environment Variables
```bash
# Channel Configuration
HINTS_CHANNEL_ID=123456789  # Specific hints channel (optional)

# Thread Settings (future enhancement)
THREAD_AUTO_ARCHIVE_HOURS=24  # How long before auto-archive
THREAD_CLEANUP_INTERVAL=6     # Hours between cleanup jobs
```

### Customizable Settings
- Thread naming patterns
- Auto-archive duration
- Cleanup frequency
- Channel whitelist for threads

## 🚨 Troubleshooting

### Common Issues
1. **Thread not created**: Check bot permissions for "Create Private Threads"
2. **Can't see thread**: Ensure user has appropriate permissions
3. **Thread disappeared**: Check if it was auto-archived (still accessible)

### Required Bot Permissions
```
- Create Private Threads
- Send Messages in Threads  
- Manage Threads
- Read Message History
- Add Reactions
```

### Debug Commands
```bash
# Manual thread cleanup (if needed)
# Could be added as admin slash command
/admin cleanup-threads channel:#hints hours:48
```

## 🔮 Future Enhancements

### Planned Features
1. **Thread Templates**: Pre-filled thread content for different problem types
2. **Collaboration Mode**: Allow users to invite others to their thread
3. **Thread Bookmarks**: Save important threads for later reference
4. **Analytics**: Detailed thread usage statistics
5. **Custom Auto-Archive**: Per-user or per-channel archive settings

### Integration Opportunities
1. **Dashboard**: Thread management interface for admins
2. **Mobile**: Better thread support in Discord mobile apps
3. **Webhooks**: Notify external systems of thread activity
4. **AI**: More intelligent thread topic detection and categorization

---

**Happy coding with organized, private learning threads! 🚀**