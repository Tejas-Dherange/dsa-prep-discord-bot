# DSA Prep Bot 🚀

A comprehensive Data Structures and Algorithms preparation platform with Discord bot integration, AI-powered solution validation, and an admin dashboard.

## 🌟 Features

### Discord Bot
- **Daily Challenges**: Automatically posts daily DSA problems
- **Solution Validation**: AI-powered code review using Gemini API
- **Real-time Stats**: User progress tracking and leaderboards
- **Interactive Commands**: Problem lookup, user stats, and help
- **Smart Notifications**: Reminders and achievement notifications

### Admin Dashboard
- **Real-time Analytics**: Discord activity, user stats, problem metrics
- **User Management**: View and manage registered users
- **Problem Sync**: Import problems from LeetCode GraphQL API
- **Submission Review**: Monitor and review user code submissions
- **Bot Configuration**: Manage bot settings and behavior

### AI Solution Validation
- **Code Analysis**: Automated correctness and efficiency review
- **Smart Scoring**: 1-10 rating system with detailed feedback
- **Multi-language Support**: JavaScript, Python, Java, C++, and more
- **Edge Case Detection**: Identifies potential issues and improvements

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DSA Prep Bot System                      │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Discord Bot   │  Backend API    │     Admin Frontend          │
│                 │                 │                             │
│ • Commands      │ • REST API      │ • React Dashboard           │
│ • Events        │ • MongoDB       │ • Real-time Stats           │
│ • AI Integration│ • User/Problem  │ • Problem Management        │
│ • Daily Posts   │   Models        │ • User Management           │
│                 │ • Discord Utils │ • Submission Review         │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Discord.js v14** for bot functionality
- **Google Gemini API** for AI code review
- **LeetCode GraphQL API** for problem sync

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** with glassmorphism design
- **React Query** for data fetching
- **Axios** for API calls

### Infrastructure
- **MongoDB Atlas** for cloud database
- **Discord Developer Portal** for bot hosting
- **Environment Variables** for secure configuration

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB instance (local or Atlas)
- Discord Bot Token
- Google Gemini API Key

### 1. Clone Repository
```bash
git clone https://github.com/Tejas-Dherange/dsa-prep-discord-bot.git
cd dsa-prep-discord-bot
```

### 2. Backend Setup
```bash
cd dsa-prep-bot-backend
npm install

# Create .env file
cp .env.example .env
# Configure environment variables (see below)

# Seed problems
npm run seed:problems

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../dsa-prep-admin-frontend
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:5000/api" > src/.env

# Start development server
npm run dev
```

### 4. Discord Bot Setup
1. Create application at [Discord Developer Portal](https://discord.com/developers/applications)
2. Create bot user and copy token
3. Enable required intents (Guild Members, Message Content)
4. Invite bot to your server with appropriate permissions

## ⚙️ Configuration

### Backend Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/dsa-prep-bot
# or MongoDB Atlas URI

# Discord Bot
DISCORD_BOT_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
GUILD_ID=your_discord_guild_id (optional, for faster command testing)

# AI Integration
GEMINI_API_KEY=your_google_gemini_api_key

# Channels
DAILY_CHALLENGE_CHANNEL_ID=your_daily_challenge_channel_id
SOLUTION_REVIEW_CHANNEL_ID=your_solution_review_channel_id

# Server
PORT=5000
NODE_ENV=development
```

### Frontend Environment Variables
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 📱 Discord Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/problem` | Get random or specific problem | `/problem difficulty:medium` |
| `/stats` | View your solving statistics | `/stats` |
| `/leaderboard` | Show top solvers | `/leaderboard` |
| `/daily` | Get today's challenge | `/daily` |
| `/help` | Show available commands | `/help` |

## 🎯 Usage

### For Users (Discord)
1. Join the Discord server
2. Use `/daily` to get today's challenge
3. Solve the problem in your preferred language
4. Post your solution in the solution channel
5. Get AI feedback and scoring
6. Track progress with `/stats`

### For Admins (Dashboard)
1. Access admin dashboard at `http://localhost:3000`
2. Monitor real-time Discord activity
3. Sync new problems from LeetCode
4. Review user submissions
5. Configure bot settings

## 🧪 Development

### Project Structure
```
dsa-prep-discord-bot/
├── dsa-prep-bot-backend/          # Node.js Backend & Bot
│   ├── src/
│   │   ├── bot/                   # Discord bot logic
│   │   │   ├── commands/          # Slash commands
│   │   │   ├── events/            # Discord events
│   │   │   ├── services/          # AI validation
│   │   │   └── config/            # Bot configuration
│   │   ├── controllers/           # API controllers
│   │   ├── models/                # MongoDB models
│   │   ├── routes/                # Express routes
│   │   └── utils/                 # Utility functions
│   └── scripts/                   # Seed and utility scripts
├── dsa-prep-admin-frontend/       # React Admin Dashboard
│   ├── src/
│   │   ├── components/            # Reusable components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API services
│   │   └── types/                 # TypeScript types
└── README.md                      # This file
```

### Running Tests
```bash
# Backend tests
cd dsa-prep-bot-backend
npm test

# Frontend tests
cd dsa-prep-admin-frontend
npm test
```

### Building for Production
```bash
# Backend
npm run build

# Frontend
npm run build
```

## 📊 Database Schema

### Key Models
- **User**: Discord user data, solving statistics, streaks
- **Problem**: LeetCode problems with metadata and examples
- **Submission**: User code submissions with AI reviews
- **Daily Challenge**: Scheduled problem posts

## 🤖 AI Integration

The bot uses Google Gemini API to provide:
- **Code Review**: Correctness, efficiency, best practices
- **Scoring**: 1-10 rating based on multiple criteria
- **Suggestions**: Optimization tips and alternative approaches
- **Learning**: Educational feedback for improvement

## 🔐 Security

- Environment variables for sensitive data
- Input validation and sanitization
- Rate limiting on API endpoints
- Discord permissions management
- Secure MongoDB connection

## 📈 Monitoring

- Real-time Discord activity tracking
- User engagement analytics
- Problem solving metrics
- Bot performance monitoring
- Error logging and debugging

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Tejas-Dherange/dsa-prep-discord-bot/issues)
- **Discord**: Join our support server
- **Email**: tejudherange2182@gmail.com

## 🙏 Acknowledgments

- LeetCode for problem data
- Discord.js community
- Google Gemini AI team
- Open source contributors

---

**Made with ❤️ for DSA learners worldwide**

*Happy Coding! 🚀*
