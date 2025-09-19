import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

const Problems: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['problems', page, search, difficulty, sortBy, sortOrder],
    queryFn: async () => {
      const response = await apiService.getProblems({
        page,
        limit: 20,
        search: search || undefined,
        difficulty: difficulty || undefined,
        sortBy,
        sortOrder
      });
      if (response.success) {
        return response.data;
      }
      throw new Error(response.message || 'Failed to fetch problems');
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDifficultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDifficulty(e.target.value);
    setPage(1);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Problems</h1>
          <p className="text-gray-600">Manage coding problems and sync from LeetCode</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading problems...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Problems</h1>
          <p className="text-gray-600">Manage coding problems and sync from LeetCode</p>
        </div>
        <div className="card">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load problems</h3>
            <p className="text-gray-500 mb-4">{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
            <button 
              onClick={() => refetch()}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Problems</h1>
        <p className="text-gray-600">Manage coding problems and sync from LeetCode</p>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search problems by title or tags..."
              value={search}
              onChange={handleSearchChange}
              className="input-field"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={difficulty}
              onChange={handleDifficultyChange}
              className="input-field"
              title="Filter by difficulty"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button
              onClick={() => refetch()}
              className="btn-secondary"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Problems Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {data && data.data && data.data.length > 0 ? (
          data.data.map((problem: any) => (
            <div key={problem._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {problem.title}
                  </h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                    {problem.category && (
                      <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {problem.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-3 line-clamp-3">
                {problem.description?.substring(0, 150)}...
              </div>

              {problem.tags && problem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {problem.tags.slice(0, 3).map((tag: string, index: number) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {tag}
                    </span>
                  ))}
                  {problem.tags.length > 3 && (
                    <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      +{problem.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>👥 {problem.usersSolved?.length || 0}</span>
                  <span>📊 {problem.totalSubmissions || 0}</span>
                  {problem.acceptanceRate && (
                    <span>✅ {(problem.acceptanceRate * 100).toFixed(1)}%</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button className="text-primary-600 hover:text-primary-800 font-medium">
                    View
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 font-medium">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🧩</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No problems found</h3>
              <p className="text-gray-500">
                {search || difficulty ? 'Try adjusting your search criteria' : 'No problems available yet'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pagination && data.data.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {data.pagination.page} of {data.pagination.pages} 
              ({data.pagination.total} total problems)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= data.pagination.pages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Problems;