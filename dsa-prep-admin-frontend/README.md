# DSA Prep Bot Admin Frontend

A modern, responsive admin dashboard for managing the DSA Prep Bot system. Built with React, TypeScript, Vite, and Tailwind CSS.

## Features
- **Dashboard**: Real-time stats, Discord integration, top solvers, recent activity, and quick actions
- **Users**: View and manage all registered users
- **Problems**: Sync, view, and manage DSA problems from LeetCode
- **Submissions**: Review and manage user submissions
- **Settings**: Configure bot and platform settings
- **Authentication**: Simple admin login (can be disabled)
- **Responsive Design**: Works on desktop and mobile
- **Beautiful UI**: Glassmorphism, gradients, and smooth animations

## Tech Stack
- **React** (TypeScript)
- **Vite** (fast dev/build)
- **Tailwind CSS** (utility-first styling)
- **React Query** (data fetching/caching)
- **Axios** (API service)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
App runs at [http://localhost:3000](http://localhost:3000)

### Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Project Structure
```
src/
  components/      # Layout, Sidebar, Header, ProtectedRoute
  contexts/        # Auth and Toast contexts
  hooks/           # Custom React hooks
  pages/           # Dashboard, Users, Problems, Submissions, Settings
  services/        # API service (axios)
  types/           # TypeScript interfaces
  utils/           # Utility functions
  index.css        # Tailwind and custom styles
  App.tsx          # Main app component
  main.tsx         # Entry point
```

## Environment Variables
Create a `.env` file in `src/` for API base URL and other secrets:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Customization
- **Tailwind**: Edit `tailwind.config.js` for theme/colors
- **API**: Update `src/services/api.ts` for backend endpoints
- **Sidebar/Routes**: Edit `src/components/Layout/Sidebar.tsx` and `src/pages/*`

## License
MIT

---
Made with ❤️ for DSA Prep Bot Admins
