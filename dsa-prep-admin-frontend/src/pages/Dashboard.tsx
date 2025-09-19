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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
        <p className="text-gray-500 mb-4">{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
        <button 
          onClick={() => refetch()}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your DSA Prep Bot system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon="👥"
          color="blue"
          growth={stats?.userGrowth}
        />
        <StatCard
          title="Total Problems"
          value={stats?.totalProblems || 0}
          icon="🧩"
          color="green"
        />
        <StatCard
          title="Total Submissions"
          value={stats?.totalSubmissions || 0}
          icon="📝"
          color="purple"
          growth={stats?.submissionGrowth}
        />
        
        {/* Enhanced Active Users Card with Discord Info */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Active Users</h3>
              <p className="text-sm text-gray-500">Currently online on Discord</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-orange-600">
              {stats?.activeUsers || 0}
            </div>
            {stats?.discordStats && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span>Online: {stats.discordStats.online}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span>Idle: {stats.discordStats.idle}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span>DND: {stats.discordStats.dnd}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Total Members: {stats.discordStats.totalMembers}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Discord Guild Info */}
      {stats?.discordStats?.guildInfo && (
        <div className="card">
          <div className="flex items-center space-x-4">
            {stats.discordStats.guildInfo.icon && (
              <img 
                src={stats.discordStats.guildInfo.icon} 
                alt="Guild Icon" 
                className="w-12 h-12 rounded-full"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Discord Server: {stats.discordStats.guildInfo.name}
              </h3>
              {stats.discordStats.guildInfo.description && (
                <p className="text-gray-600">{stats.discordStats.guildInfo.description}</p>
              )}
              <p className="text-sm text-gray-500">
                Total Members: {stats.discordStats.guildInfo.memberCount}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Problems Solved Today"
          value={stats?.problemsSolvedToday || 0}
          icon="✅"
          color="green"
        />
        
        {/* Difficulty Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Problem Difficulty</h3>
          {stats?.difficultyStats && stats.difficultyStats.length > 0 ? (
            <div className="space-y-3">
              {stats.difficultyStats.map((diff: any) => (
                <div key={diff._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      diff._id === 'easy' ? 'bg-green-500' :
                      diff._id === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium capitalize">{diff._id}</span>
                  </div>
                  <span className="text-sm text-gray-600">{diff.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <span className="text-2xl mb-2 block">📊</span>
              <p className="text-sm">No difficulty data</p>
            </div>
          )}
        </div>

        {/* Language Statistics */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Languages</h3>
          {stats?.languageStats && stats.languageStats.length > 0 ? (
            <div className="space-y-3">
              {stats.languageStats.slice(0, 5).map((lang: any) => (
                <div key={lang._id} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{lang._id || 'Unknown'}</span>
                  <span className="text-sm text-gray-600">{lang.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <span className="text-2xl mb-2 block">💻</span>
              <p className="text-sm">No language data</p>
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Solvers */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Solvers</h3>
          {stats?.topSolvers && stats.topSolvers.length > 0 ? (
            <div className="space-y-3">
              {stats.topSolvers.slice(0, 5).map((solver, index) => (
                <div key={solver.user._id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-sm">
                        {solver.user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{solver.user.username}</p>
                      <p className="text-sm text-gray-500">
                        {solver.problemsSolved} problems solved
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-primary-600">#{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">🏆</span>
              <p>No solvers yet</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-sm">
                      {getActivityIcon(activity.type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user.username}</span>{' '}
                      {getActivityText(activity.type)}
                      {activity.problem && (
                        <span className="font-medium"> {activity.problem.title}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">📋</span>
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionButton
            title="Sync Problems"
            description="Fetch latest problems from LeetCode"
            icon="🔄"
            href="/problems"
          />
          <QuickActionButton
            title="View Users"
            description="Manage users and permissions"
            icon="👥"
            href="/users"
          />
          <QuickActionButton
            title="Check Submissions"
            description="Review recent submissions"
            icon="📝"
            href="/submissions"
          />
          <QuickActionButton
            title="Bot Settings"
            description="Configure bot behavior"
            icon="⚙️"
            href="/settings"
          />
        </div>
      </div>
    </div>
  );
};

// Helper Components
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  growth?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, growth }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {growth !== undefined && (
            <p className={`text-sm ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth >= 0 ? '↗' : '↘'} {Math.abs(growth)}% from last month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );
};

interface QuickActionButtonProps {
  title: string;
  description: string;
  icon: string;
  href: string;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ title, description, icon, href }) => {
  return (
    <a
      href={href}
      className="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
    >
      <div className="text-center">
        <div className="text-2xl mb-2">{icon}</div>
        <h4 className="font-medium text-gray-900 group-hover:text-primary-900">{title}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </a>
  );
};

// Helper Functions
const getActivityIcon = (type: string) => {
  switch (type) {
    case 'user_joined': return '👋';
    case 'problem_solved': return '✅';
    case 'submission_made': return '📤';
    default: return '📋';
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

export default Dashboard;