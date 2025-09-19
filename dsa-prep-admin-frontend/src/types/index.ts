export interface User {
  _id: string;
  discordId: string;
  username: string;
  email?: string;
  role: 'user' | 'moderator' | 'admin';
  stats: {
    problemsSolved: number;
    totalSubmissions: number;
    currentStreak: number;
    longestStreak: number;
    lastSubmissionDate?: Date;
  };
  preferences: {
    difficulty: 'easy' | 'medium' | 'hard' | 'all';
    topics: string[];
    dailyReminder: boolean;
    reminderTime: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Problem {
  _id: string;
  leetcodeId: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  description: string;
  constraints?: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  hints?: string[];
  companies?: string[];
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Submission {
  _id: string;
  userId: string;
  problemId: string;
  solution: string;
  language: string;
  status: 'pending' | 'accepted' | 'rejected' | 'timeout';
  submittedAt: Date;
  user?: User;
  problem?: Problem;
}

export interface DashboardStats {
  totalUsers: number;
  totalProblems: number;
  totalSubmissions: number;
  activeUsers: number;
  problemsSolvedToday: number;
  userGrowth: number;
  submissionGrowth: number;
  topSolvers: Array<{
    user: User;
    problemsSolved: number;
  }>;
  recentActivity: Array<{
    type: 'user_joined' | 'problem_solved' | 'submission_made';
    user: User;
    problem?: Problem;
    timestamp: Date;
  }>;
  difficultyStats: Array<{
    _id: string;
    count: number;
  }>;
  languageStats: Array<{
    _id: string;
    count: number;
  }>;
  discordStats?: {
    online: number;
    idle: number;
    dnd: number;
    offline: number;
    totalMembers: number;
    guildInfo?: {
      id: string;
      name: string;
      memberCount: number;
      description?: string;
      icon?: string;
    };
  };
}

export interface AuthUser {
  _id: string;
  username: string;
  email?: string;
  role: 'moderator' | 'admin';
  discordId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortOrder;
}

export interface FilterConfig {
  search?: string;
  role?: string;
  difficulty?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}