import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

const Dashboard: React.FC = () => {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const response = await apiService.getDashboardStats();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch dashboard stats');
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading Dashboard</h3>
          <p className="text-gray-500">Fetching your latest data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.664 0L4.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Oops! Something went wrong</h3>
          <p className="text-gray-600 mb-6">{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
          <button 
            onClick={() => refetch()}
            className="btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-xl blur-xl"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">Dashboard Overview</h1>
              <p className="text-gray-600 text-lg">Monitor your DSA Prep Bot ecosystem in real-time</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{new Date().getDate()}</div>
                <div className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { month: 'short' })}</div>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-2xl animate-float">
                🚀
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon="👥"
          color="blue"
          growth={stats?.userGrowth}
          subtitle="Registered members"
        />
        <StatCard
          title="Total Problems"
          value={stats?.totalProblems || 0}
          icon="🧩"
          color="emerald"
          subtitle="Available challenges"
        />
        <StatCard
          title="Total Submissions"
          value={stats?.totalSubmissions || 0}
          icon="📝"
          color="purple"
          growth={stats?.submissionGrowth}
          subtitle="Code submissions"
        />
        
        {/* Enhanced Active Users Card */}
        <ActiveUsersCard stats={stats} />
      </div>

      {/* Discord Server Info */}
      {stats?.discordStats?.guildInfo && (
        <DiscordGuildCard guildInfo={stats.discordStats.guildInfo} />
      )}

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
        <StatCard
          title="Daily Solvers"
          value={stats?.problemsSolvedToday || 0}
          icon="🎯"
          color="green"
          subtitle="Problems solved today"
        />
        
        <DifficultyDistributionCard stats={stats?.difficultyStats} />
        <LanguageStatsCard stats={stats?.languageStats} />
      </div>

      {/* Activity and Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
        <TopSolversCard solvers={stats?.topSolvers} />
        <RecentActivityCard activities={stats?.recentActivity} />
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsPanel />
    </div>
  );
};

// Enhanced Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'emerald' | 'purple' | 'green' | 'orange' | 'red';
  growth?: number;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, growth, subtitle }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
  };

  const bgClasses = {
    blue: 'from-blue-50 to-blue-100',
    emerald: 'from-emerald-50 to-emerald-100',
    purple: 'from-purple-50 to-purple-100',
    green: 'from-green-50 to-green-100',
    orange: 'from-orange-50 to-orange-100',
    red: 'from-red-50 to-red-100',
  };

  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`icon-container bg-gradient-to-br ${bgClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-3xl font-bold text-gray-900">
          {value.toLocaleString()}
        </div>
        
        {growth !== undefined && (
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              growth >= 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <svg className={`w-3 h-3 ${growth >= 0 ? 'transform rotate-0' : 'transform rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l6-6 6 6" />
              </svg>
              <span>{Math.abs(growth)}%</span>
            </div>
            <span className="text-xs text-gray-500">vs last month</span>
          </div>
        )}
        
        <div className="progress-bar h-2">
          <div 
            className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full transition-all duration-700 ease-out opacity-80`}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Active Users Card Component
const ActiveUsersCard: React.FC<{ stats: any }> = ({ stats }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between mb-4">
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Active Users</h3>
        <p className="text-xs text-gray-500 mt-1">Discord presence</p>
      </div>
      <div className="icon-container bg-gradient-to-br from-orange-50 to-orange-100">
        <span className="text-2xl">⚡</span>
      </div>
    </div>
    
    <div className="text-3xl font-bold text-gray-900 mb-4">
      {stats?.activeUsers || 0}
    </div>
    
    {stats?.discordStats && (
      <div className="space-y-2">
        <PresenceIndicator 
          status="online" 
          count={stats.discordStats.online} 
          color="green"
        />
        <PresenceIndicator 
          status="idle" 
          count={stats.discordStats.idle} 
          color="yellow"
        />
        <PresenceIndicator 
          status="dnd" 
          count={stats.discordStats.dnd} 
          color="red"
        />
        <div className="pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Total Members: <span className="font-medium">{stats.discordStats.totalMembers}</span>
          </div>
        </div>
      </div>
    )}
  </div>
);

const PresenceIndicator: React.FC<{ status: string; count: number; color: string }> = ({ status, count, color }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full bg-${color}-500 animate-pulse`}></div>
      <span className="text-sm capitalize">{status}</span>
    </div>
    <span className="text-sm font-medium">{count}</span>
  </div>
);

// Discord Guild Card Component
const DiscordGuildCard: React.FC<{ guildInfo: any }> = ({ guildInfo }) => (
  <div className="card-glass">
    <div className="flex items-center  space-x-4">
      {guildInfo.icon && (
        <div className="relative">
          <img 
            src={guildInfo.icon} 
            alt="Guild Icon" 
            className="w-16 h-16 rounded-full shadow-lg"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        </div>
      )}
      <div className="flex-1">
        <h3 className="text-xl font-bold mb-1">
          {guildInfo.name}
        </h3>
        {guildInfo.description && (
          <p className="text-gray-200 mb-2">{guildInfo.description}</p>
        )}
        <div className="flex items-center space-x-4 text-sm text-gray-300">
          <span>👥 {guildInfo.memberCount} members</span>
          <span>🟢 Active community</span>
        </div>
      </div>
    </div>
  </div>
);

// Difficulty Distribution Card
const DifficultyDistributionCard: React.FC<{ stats: any[] }> = ({ stats }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      <span className="mr-2">📊</span>
      Problem Difficulty
    </h3>
    {stats && stats.length > 0 ? (
      <div className="space-y-3">
        {stats.map((diff: any) => {
          const colors = {
            easy: { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-50' },
            medium: { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-50' },
            hard: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50' }
          };
          const color = colors[diff._id as keyof typeof colors] || colors.easy;
          
          return (
            <div key={diff._id} className={`p-3 rounded-lg ${color.light} transition-all duration-200 hover:shadow-sm`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${color.bg}`}></div>
                  <span className={`font-medium capitalize ${color.text}`}>{diff._id}</span>
                </div>
                <span className={`font-bold ${color.text}`}>{diff.count}</span>
              </div>
            </div>
          );
        })}
      </div>
    ) : (
      <EmptyState icon="📊" message="No difficulty data" />
    )}
  </div>
);

// Language Stats Card
const LanguageStatsCard: React.FC<{ stats: any[] }> = ({ stats }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
      <span className="mr-2">💻</span>
      Popular Languages
    </h3>
    {stats && stats.length > 0 ? (
      <div className="space-y-3">
        {stats.slice(0, 5).map((lang: any, index: number) => (
          <div key={lang._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getLanguageColor(index)} text-white text-xs flex items-center justify-center font-bold`}>
                {index + 1}
              </div>
              <span className="font-medium">{lang._id || 'Unknown'}</span>
            </div>
            <span className="text-sm text-gray-600 font-medium">{lang.count}</span>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState icon="💻" message="No language data" />
    )}
  </div>
);

// Top Solvers Card
const TopSolversCard: React.FC<{ solvers: any[] }> = ({ solvers }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
      <span className="mr-2">🏆</span>
      Top Performers
    </h3>
    {solvers && solvers.length > 0 ? (
      <div className="space-y-4">
        {solvers.slice(0, 5).map((solver, index) => (
          <div key={solver.user._id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
            <div className={`relative w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
              index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
              index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
              index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-800' :
              'bg-gradient-to-r from-blue-400 to-blue-600'
            }`}>
              #{index + 1}
              {index < 3 && (
                <div className="absolute -top-1 -right-1 text-lg">
                  {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{solver.user.username}</p>
              <p className="text-sm text-gray-500">
                {solver.problemsSolved} problems solved
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-blue-600">
                {solver.score || 'N/A'} pts
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState icon="🏆" message="No solvers yet" subtitle="Be the first to solve problems!" />
    )}
  </div>
);

// Recent Activity Card
const RecentActivityCard: React.FC<{ activities: any[] }> = ({ activities }) => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
      <span className="mr-2">📱</span>
      Recent Activity
    </h3>
    {activities && activities.length > 0 ? (
      <div className="space-y-4">
        {activities.slice(0, 5).map((activity, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-all duration-200">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${getActivityBg(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user.username}</span>{' '}
                {getActivityText(activity.type)}
                {activity.problem && (
                  <span className="font-medium text-blue-600"> {activity.problem.title}</span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatTimeAgo(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyState icon="📱" message="No recent activity" subtitle="Activity will appear here" />
    )}
  </div>
);

// Quick Actions Panel
const QuickActionsPanel: React.FC = () => (
  <div className="card">
    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
      <span className="mr-2">⚡</span>
      Quick Actions
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <QuickActionCard
        title="Sync Problems"
        description="Update from LeetCode"
        icon="🔄"
        href="/problems"
        color="blue"
      />
      <QuickActionCard
        title="Manage Users"
        description="View all members"
        icon="👥"
        href="/users"
        color="emerald"
      />
      <QuickActionCard
        title="View Submissions"
        description="Check latest code"
        icon="📝"
        href="/submissions"
        color="purple"
      />
      <QuickActionCard
        title="Bot Settings"
        description="Configure behavior"
        icon="⚙️"
        href="/settings"
        color="orange"
      />
    </div>
  </div>
);

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, description, icon, href, color }) => (
  <a href={href} className="quick-action-card group">
    <div className="text-center">
      <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-200">
        {icon}
      </div>
      <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
        {title}
      </h4>
      <p className="text-sm text-gray-500 mt-1 group-hover:text-blue-600 transition-colors">
        {description}
      </p>
    </div>
  </a>
);

// Helper Components and Functions
const EmptyState: React.FC<{ icon: string; message: string; subtitle?: string }> = ({ icon, message, subtitle }) => (
  <div className="text-center py-8 text-gray-500">
    <div className="text-4xl mb-3 opacity-50">{icon}</div>
    <p className="font-medium">{message}</p>
    {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
  </div>
);

const getLanguageColor = (index: number) => {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-red-500 to-red-600',
    'from-yellow-500 to-yellow-600'
  ];
  return colors[index] || 'from-gray-500 to-gray-600';
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'user_joined': return '👋';
    case 'problem_solved': return '✅';
    case 'submission_made': return '📤';
    default: return '📋';
  }
};

const getActivityBg = (type: string) => {
  switch (type) {
    case 'user_joined': return 'bg-green-100 text-green-600';
    case 'problem_solved': return 'bg-blue-100 text-blue-600';
    case 'submission_made': return 'bg-purple-100 text-purple-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const getActivityText = (type: string) => {
  switch (type) {
    case 'user_joined': return 'joined the platform';
    case 'problem_solved': return 'solved';
    case 'submission_made': return 'submitted solution for';
    default: return 'performed action on';
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default Dashboard;