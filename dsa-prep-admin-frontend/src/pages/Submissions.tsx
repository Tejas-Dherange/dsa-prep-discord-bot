import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

const Submissions: React.FC = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['submissions', page, status],
    queryFn: async () => {
      const response = await apiService.getSubmissions({
        page,
        limit: 20,
        status: status || undefined,
        sortBy: 'submissionTime',
        sortOrder: 'desc'
      });

      // console.log("Fetched Submissions:", response);
      
      if (response.success) {
        return response;
      }
      throw new Error(response.message || 'Failed to fetch submissions');
    },
  });

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'wrong answer': return 'bg-red-100 text-red-800';
      case 'time limit exceeded': return 'bg-yellow-100 text-yellow-800';
      case 'memory limit exceeded': return 'bg-orange-100 text-orange-800';
      case 'runtime error': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return '✅';
      case 'wrong answer': return '❌';
      case 'time limit exceeded': return '⏰';
      case 'memory limit exceeded': return '💾';
      case 'runtime error': return '⚠️';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-gray-600">Review and manage user submissions</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading submissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
          <p className="text-gray-600">Review and manage user submissions</p>
        </div>
        <div className="card">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load submissions</h3>
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
        <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
        <p className="text-gray-600">Review and manage user submissions</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-4">
            <select
              value={status}
              onChange={handleStatusChange}
              className="input-field"
              title="Filter by status"
            >
              <option value="">All Status</option>
              <option value="Accepted">Accepted</option>
              <option value="Wrong Answer">Wrong Answer</option>
              <option value="Time Limit Exceeded">Time Limit Exceeded</option>
              <option value="Memory Limit Exceeded">Memory Limit Exceeded</option>
              <option value="Runtime Error">Runtime Error</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="btn-secondary"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {data && data.data && data.data.length > 0 ? (
          data.data.map((submission: any) => (
            <div key={submission._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {submission.userId?.avatar ? (
                        <img 
                          className="h-8 w-8 rounded-full" 
                          src={submission.userId.avatar} 
                          alt="" 
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-sm">
                            {submission.userId?.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {submission.userId?.username || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {submission.submissionTime ? 
                            new Date(submission.submissionTime).toLocaleString() : 
                            'Unknown time'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {submission.problemId?.title || 'Unknown Problem'}
                    </h3>
                    {submission.problemId?.difficulty && (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        submission.problemId.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        submission.problemId.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {submission.problemId.difficulty}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <span>💻</span>
                      <span>{submission.language || 'Unknown'}</span>
                    </div>
                    {submission.runtime && (
                      <div className="flex items-center space-x-1">
                        <span>⏱️</span>
                        <span>{submission.runtime}ms</span>
                      </div>
                    )}
                    {submission.memory && (
                      <div className="flex items-center space-x-1">
                        <span>💾</span>
                        <span>{submission.memory}MB</span>
                      </div>
                    )}
                    {submission.timeSpent && (
                      <div className="flex items-center space-x-1">
                        <span>🕐</span>
                        <span>{Math.round(submission.timeSpent / 60)}min</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(submission.status)}`}>
                    <span className="mr-1">{getStatusIcon(submission.status)}</span>
                    {submission.status || 'Unknown'}
                  </span>
                  
                  <div className="flex space-x-2">
                    <button className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                      View Code
                    </button>
                    {submission.status === 'Pending' && (
                      <button className="text-yellow-600 hover:text-yellow-800 text-sm font-medium">
                        Rerun
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {submission.feedback && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Feedback:</span> {submission.feedback}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="card">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-500">
                {status ? 'Try adjusting your filter criteria' : 'No submissions have been made yet'}
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
              ({data.pagination.total} total submissions)
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

export default Submissions;