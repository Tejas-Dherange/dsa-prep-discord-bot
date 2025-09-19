# DSA Prep Bot Backend

A comprehensive Node.js backend for a MERN stack DSA (Data Structures & Algorithms) preparation application with integrated Discord bot functionality.

## 🚀 Features

### Discord Bot
- **Interactive Commands**: `!ping`, `!help`, `!daily`, `!streak`, `!leaderboard`
- **Daily Challenges**: Automated daily DSA problem posting with cron jobs
- **Slash Commands**: Modern Discord slash command support
- **Real-time Notifications**: Streak reminders and achievement notifications

### REST API
- **User Management**: Complete CRUD operations for user profiles
- **Problem Database**: Extensive DSA problem collection with categorization
- **Submission Tracking**: Code submission history and analytics
- **Leaderboards**: Multiple ranking systems (streaks, total problems, etc.)
- **Statistics**: Comprehensive user and problem analytics

### Database Features
- **MongoDB Integration**: Robust data modeling with Mongoose
- **Relationships**: Proper user-problem-submission relationships
- **Indexing**: Optimized queries for better performance
- **Validation**: Comprehensive data validation and constraints

## 📂 Project Structure

```
dsa-prep-bot-backend/
├── package.json                 # Dependencies and scripts
├── server.js                   # Express server entry point
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
│
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── discordClient.js   # Discord client setup
│   │
│   ├── bot/
│   │   ├── index.js           # Bot initialization
│   │   ├── events/
│   │   │   ├── ready.js       # Bot ready handler
│   │   │   ├── message.js     # Message event handler
│   │   │   └── interaction.js # Interaction handler
│   │   ├── commands/
│   │   │   └── ping.js        # Ping slash command
│   │   └── jobs/
│   │       └── dailyChallenge.js # Daily problem cron job
│   │
│   ├── controllers/
│   │   ├── userController.js     # User API logic
│   │   ├── problemController.js  # Problem API logic
│   │   └── submissionController.js # Submission API logic
│   │
│   ├── models/
│   │   ├── User.js            # User schema
│   │   ├── Problem.js         # Problem schema
│   │   └── Submission.js      # Submission schema
│   │
│   ├── routes/
│   │   ├── userRoutes.js      # User endpoints
│   │   ├── problemRoutes.js   # Problem endpoints
│   │   └── submissionRoutes.js # Submission endpoints
│   │
│   └── utils/
│       ├── problemFetcher.js  # LeetCode API integration
│       └── streakHelper.js    # Streak calculation logic
│
└── logs/                      # Application logs
    └── bot.log
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or Atlas)
- Discord Bot Token
- Git

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd dsa-prep-bot-backend
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Discord Bot Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token to your `.env` file
5. Enable required intents:
   - Guilds
   - Guild Messages  
   - Message Content
   - Direct Messages
6. Invite bot to your server with appropriate permissions

### 4. MongoDB Setup
**Local MongoDB:**
```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**MongoDB Atlas:**
```bash
# Create cluster at https://cloud.mongodb.com
# Get connection string and add to .env
```

### 5. Start the Application
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Bot only (without Express server)
npm run bot
```

## 📊 API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/discord/:discordId` - Get user by Discord ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/:id/stats` - Get user statistics
- `GET /api/users/leaderboard` - Get leaderboard

### Problems
- `GET /api/problems` - Get all problems
- `GET /api/problems/:id` - Get problem by ID
- `GET /api/problems/slug/:slug` - Get problem by slug
- `GET /api/problems/random` - Get random problem
- `GET /api/problems/daily` - Get daily challenge
- `POST /api/problems` - Create new problem
- `PUT /api/problems/:id` - Update problem

### Submissions
- `GET /api/submissions` - Get all submissions
- `GET /api/submissions/:id` - Get submission by ID
- `POST /api/submissions` - Create submission
- `PUT /api/submissions/:id` - Update submission (judge results)
- `GET /api/submissions/user/:userId` - Get user submissions
- `GET /api/submissions/stats` - Get submission statistics

## 🤖 Discord Bot Commands

### Prefix Commands
- `!ping` - Test bot responsiveness
- `!help` - Show available commands
- `!daily` - Get today's challenge (coming soon)
- `!streak` - Check your streak (coming soon)
- `!leaderboard` - View top performers (coming soon)

### Slash Commands
- `/ping` - Test bot with latency info

## 📈 Features in Detail

### Streak System
- **Daily Tracking**: Automatic streak calculation
- **Streak Breaks**: Smart detection of broken streaks
- **Motivational Messages**: Encouraging streak messages
- **Leaderboards**: Streak-based rankings

### Problem Management
- **LeetCode Integration**: Fetch problems from LeetCode API
- **Custom Problems**: Add your own DSA problems
- **Categorization**: Problems organized by topic and difficulty
- **Search & Filter**: Advanced problem discovery

### Analytics
- **User Progress**: Detailed solving statistics
- **Problem Analytics**: Acceptance rates and popularity
- **Language Statistics**: Programming language preferences
- **Performance Metrics**: Runtime and memory tracking

## 🔧 Configuration

### Environment Variables
```env
# Essential Configuration
MONGO_URI=mongodb://localhost:27017/dsa-prep-bot
BOT_TOKEN=your_discord_bot_token
PORT=5000

# Optional Features
DAILY_CHALLENGE_CHANNEL_ID=channel_id
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
```

### Discord Intents Required
- `GUILDS` - Basic guild access
- `GUILD_MESSAGES` - Read guild messages
- `MESSAGE_CONTENT` - Access message content
- `DIRECT_MESSAGES` - Handle DMs

## 🚀 Deployment

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### PM2 Deployment
```bash
npm install -g pm2
pm2 start server.js --name "dsa-prep-bot"
pm2 startup
pm2 save
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run with coverage
npm run test:coverage

# Integration tests
npm run test:integration
```

## 📝 Logging

- **Winston Logger**: Structured logging with levels
- **File Logging**: Separate error and combined logs
- **Console Output**: Development-friendly console logs
- **Log Rotation**: Automatic log file management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check this README and code comments
- **Issues**: Open GitHub issues for bugs/features
- **Discord**: Join our Discord server for community support

## 🔮 Roadmap

- [ ] Slash command implementation
- [ ] Frontend React application
- [ ] Code execution engine
- [ ] Contest mode
- [ ] AI-powered hints
- [ ] Mobile app integration
- [ ] Advanced analytics dashboard

---

Built with ❤️ for the coding community