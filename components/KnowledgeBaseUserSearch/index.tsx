'use client';

import {
  useKnowledgeBaseUserSearch,
  type UserSearchResult,
} from '@/hooks/useKnowledgeBaseUserSearch';
import { Avatar, Badge, Button, Card, TextInput } from 'flowbite-react';
import React, { useEffect, useState } from 'react';

/**
 * Props for KnowledgeBaseUserSearch component
 */
interface KnowledgeBaseUserSearchProps {
  knowledgeBaseId: string;
  className?: string;
  onUserSelect?: (user: UserSearchResult) => void;
  showAssignmentSearch?: boolean;
  initialPageSize?: number;
}

/**
 * Component for searching and managing users in knowledge base context
 */
export const KnowledgeBaseUserSearch: React.FC<
  KnowledgeBaseUserSearchProps
> = ({
  knowledgeBaseId,
  className = '',
  onUserSelect,
  showAssignmentSearch = false,
  initialPageSize = 10,
}) => {
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'assignment' | 'stats'>(
    'users',
  );

  // Hook for user search operations
  const {
    users,
    assignmentResults,
    loading,
    assignmentLoading,
    error,
    currentPage,
    totalItems,
    hasMore,
    statistics,
    searchUsers,
    searchUsersForAssignment,
    loadStatistics,
    clearError,
  } = useKnowledgeBaseUserSearch();

  // Load initial data
  useEffect(() => {
    if (knowledgeBaseId) {
      searchUsers(knowledgeBaseId, 1, initialPageSize);
      loadStatistics(knowledgeBaseId);
    }
  }, [knowledgeBaseId, initialPageSize, searchUsers, loadStatistics]);

  // Handle search term changes with debouncing
  useEffect(() => {
    if (!knowledgeBaseId) return;

    const timeoutId = setTimeout(() => {
      searchUsers(knowledgeBaseId, 1, initialPageSize, searchTerm || undefined);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, knowledgeBaseId, initialPageSize, searchUsers]);

  // Handle assignment search
  useEffect(() => {
    if (!knowledgeBaseId || !showAssignmentSearch) return;

    const timeoutId = setTimeout(() => {
      if (assignmentSearchTerm.trim()) {
        searchUsersForAssignment(knowledgeBaseId, assignmentSearchTerm, 10);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    assignmentSearchTerm,
    knowledgeBaseId,
    showAssignmentSearch,
    searchUsersForAssignment,
  ]);

  // Handle load more
  const handleLoadMore = async () => {
    if (hasMore && !loading) {
      await searchUsers(
        knowledgeBaseId,
        currentPage + 1,
        initialPageSize,
        searchTerm || undefined,
      );
    }
  };

  // Handle user selection
  const handleUserClick = (user: UserSearchResult) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Error Display */}
      {error && (
        <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-600 dark:bg-red-900/20'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-red-700 dark:text-red-300'>
              {error}
            </span>
            <button
              onClick={clearError}
              className='text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className='border-b border-gray-200 dark:border-gray-700'>
        <nav className='-mb-px flex space-x-8'>
          <button
            onClick={() => setActiveTab('users')}
            className={`border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Users ({totalItems})
          </button>
          {showAssignmentSearch && (
            <button
              onClick={() => setActiveTab('assignment')}
              className={`border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
                activeTab === 'assignment'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Assignment Search
            </button>
          )}
          <button
            onClick={() => setActiveTab('stats')}
            className={`border-b-2 px-1 py-2 text-sm font-medium whitespace-nowrap ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Statistics
          </button>
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className='space-y-4'>
          {/* Search Input */}
          <TextInput
            type='text'
            placeholder='Search users by email, name, or department...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Loading State */}
          {loading && users.length === 0 && (
            <div className='py-8 text-center'>
              <div className='inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
              <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                Loading users...
              </p>
            </div>
          )}

          {/* Users List */}
          {users.length > 0 && (
            <div className='grid gap-3'>
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800 ${
                    onUserSelect ? 'cursor-pointer' : ''
                  }`}
                  onClick={
                    onUserSelect ? () => handleUserClick(user) : undefined
                  }
                >
                  <div className='flex items-center space-x-3'>
                    <Avatar
                      img={user.avatar_url || undefined}
                      alt={user.display_name || user.email}
                      size='sm'
                    />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium text-gray-900 dark:text-gray-100'>
                        {user.display_name || user.full_name || 'Unknown User'}
                      </p>
                      <p className='truncate text-sm text-gray-600 dark:text-gray-400'>
                        {user.email}
                      </p>
                      {user.department_name && (
                        <Badge color='info' size='sm' className='mt-1'>
                          {user.department_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className='text-center'>
              <Button color='light' onClick={handleLoadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}

          {/* No Results */}
          {users.length === 0 && !loading && (
            <div className='py-8 text-center'>
              <h3 className='mt-2 text-sm font-medium text-gray-900 dark:text-gray-100'>
                No users found
              </h3>
              <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                {searchTerm
                  ? 'Try adjusting your search terms.'
                  : 'No users are available.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Assignment Search Tab */}
      {activeTab === 'assignment' && showAssignmentSearch && (
        <div className='space-y-4'>
          <TextInput
            type='text'
            placeholder='Search users to assign to this knowledge base...'
            value={assignmentSearchTerm}
            onChange={(e) => setAssignmentSearchTerm(e.target.value)}
          />

          {assignmentLoading && (
            <div className='py-4 text-center'>
              <div className='inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600'></div>
              <span className='ml-2 text-sm text-gray-600 dark:text-gray-400'>
                Searching available users...
              </span>
            </div>
          )}

          {assignmentResults.length > 0 && (
            <div className='grid gap-3'>
              {assignmentResults.map((user) => (
                <div
                  key={user.id}
                  className={`rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800 ${
                    onUserSelect ? 'cursor-pointer' : ''
                  }`}
                  onClick={
                    onUserSelect ? () => handleUserClick(user) : undefined
                  }
                >
                  <div className='flex items-center space-x-3'>
                    <Avatar
                      img={user.avatar_url || undefined}
                      alt={user.display_name || user.email}
                      size='sm'
                    />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-medium text-gray-900 dark:text-gray-100'>
                        {user.display_name || 'Unknown User'}
                      </p>
                      <p className='truncate text-sm text-gray-600 dark:text-gray-400'>
                        {user.email}
                      </p>
                      {user.department_name && (
                        <Badge color='info' size='sm' className='mt-1'>
                          {user.department_name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {assignmentSearchTerm &&
            assignmentResults.length === 0 &&
            !assignmentLoading && (
              <div className='py-8 text-center'>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  No available users found for assignment.
                </p>
              </div>
            )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className='space-y-4'>
          {statistics ? (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
              <Card>
                <h5 className='text-lg font-bold text-gray-900 dark:text-white'>
                  Total Users
                </h5>
                <p className='text-3xl font-bold text-blue-600 dark:text-blue-400'>
                  {statistics.totalUsers}
                </p>
              </Card>

              <Card>
                <h5 className='text-lg font-bold text-gray-900 dark:text-white'>
                  Active Users
                </h5>
                <p className='text-3xl font-bold text-green-600 dark:text-green-400'>
                  {statistics.activeUsers}
                </p>
              </Card>

              <Card>
                <h5 className='mb-3 text-lg font-bold text-gray-900 dark:text-white'>
                  Role Distribution
                </h5>
                <div className='space-y-2'>
                  {statistics.roleDistribution.map((roleData) => (
                    <div
                      key={roleData.role}
                      className='flex items-center justify-between'
                    >
                      <span className='text-sm text-gray-600 dark:text-gray-400'>
                        {roleData.role}
                      </span>
                      <Badge color='info'>{roleData.count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <div className='py-8 text-center'>
              <div className='inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
              <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                Loading statistics...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
