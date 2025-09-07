'use client';

import { useUserService } from '@/hooks/useUserService';
import { Button } from 'flowbite-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

interface UserListComponentProps {
  excludeIds?: string[];
  onUserSelect?: (user: {
    id: string;
    email: string;
    display_name?: string;
    full_name?: string;
    avatar_url?: string;
  }) => void;
}

/**
 * Example component demonstrating user service usage with error handling
 * following the pattern from the users list page
 */
export const UserListComponent: React.FC<UserListComponentProps> = ({
  excludeIds = [],
  onUserSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const {
    users,
    searchResults,
    userStatistics,
    loading,
    searchLoading,
    error,
    fetchUsers,
    searchUsersForAssignment,
    fetchUserStatistics,
    clearSearch,
    clearError,
    refresh,
  } = useUserService();

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchUsers({ limit: 10, exclude_ids: excludeIds }),
        fetchUserStatistics(),
      ]);
    };
    loadInitialData();
  }, [fetchUsers, fetchUserStatistics, excludeIds]);

  // Handle search
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      await searchUsersForAssignment(term, excludeIds, 10);
    } else {
      clearSearch();
    }
  };

  // Handle user selection
  const handleUserClick = (user: {
    id: string;
    email: string;
    display_name?: string;
    full_name?: string;
    avatar_url?: string;
  }) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  // Error display component similar to users list page
  if (error) {
    return (
      <div className='rounded-lg bg-red-50 p-4 dark:bg-red-900/20'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <svg
              className='h-5 w-5 text-red-400'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-red-800 dark:text-red-200'>
              Error loading users
            </h3>
            <div className='mt-2 text-sm text-red-700 dark:text-red-300'>
              {error}
            </div>
            <div className='mt-4'>
              <div className='flex space-x-2'>
                <Button
                  size='xs'
                  color='failure'
                  onClick={() => {
                    clearError();
                    refresh();
                  }}
                >
                  Try Again
                </Button>
                <Button size='xs' color='gray' onClick={clearError}>
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header with statistics */}
      {userStatistics && (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
          <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              Total Users
            </div>
            <div className='text-2xl font-bold text-gray-900 dark:text-white'>
              {userStatistics.total}
            </div>
          </div>
          <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              Active
            </div>
            <div className='text-2xl font-bold text-green-600'>
              {userStatistics.active}
            </div>
          </div>
          <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              Inactive
            </div>
            <div className='text-2xl font-bold text-gray-500'>
              {userStatistics.inactive}
            </div>
          </div>
          <div className='rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800'>
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              Departments
            </div>
            <div className='text-2xl font-bold text-blue-600'>
              {userStatistics.departments}
            </div>
          </div>
        </div>
      )}

      {/* Search section */}
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
          Users
        </h3>
        <Button
          onClick={() => setShowSearch(!showSearch)}
          className='bg-blue-600 hover:bg-blue-700'
        >
          {showSearch ? 'Hide Search' : 'Search Users'}
        </Button>
      </div>

      {/* Search input */}
      {showSearch && (
        <div className='flex space-x-2'>
          <input
            type='text'
            placeholder='Search users by email or name...'
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className='flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white'
          />
          {searchTerm && (
            <Button
              color='gray'
              onClick={() => {
                setSearchTerm('');
                clearSearch();
              }}
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Loading state */}
      {(loading || searchLoading) && (
        <div className='flex items-center justify-center py-8'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <span className='ml-2 text-gray-600 dark:text-gray-400'>
            {searchLoading ? 'Searching users...' : 'Loading users...'}
          </span>
        </div>
      )}

      {/* Users list */}
      {!loading && !searchLoading && (
        <div className='overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'>
          <div className='border-b border-gray-200 px-4 py-3 dark:border-gray-700'>
            <h4 className='text-sm font-medium text-gray-900 dark:text-white'>
              {searchTerm
                ? `Search Results (${searchResults.length})`
                : `All Users (${users.length})`}
            </h4>
          </div>
          <div className='divide-y divide-gray-200 dark:divide-gray-700'>
            {(searchTerm ? searchResults : users).map((user) => (
              <div
                key={user.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  onUserSelect ? 'cursor-pointer' : ''
                }`}
                onClick={() => handleUserClick(user)}
              >
                <div className='flex items-center space-x-3'>
                  {/* Avatar */}
                  <div className='flex-shrink-0'>
                    {user.avatar_url ? (
                      <Image
                        className='h-10 w-10 rounded-full'
                        src={user.avatar_url}
                        alt={user.display_name || user.email}
                        width={40}
                        height={40}
                      />
                    ) : (
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 dark:bg-gray-600'>
                        <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                          {(user.display_name || user.email)
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User info */}
                  <div className='min-w-0 flex-1'>
                    <p className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                      {user.display_name || user.full_name || user.email}
                    </p>
                    <p className='truncate text-sm text-gray-500 dark:text-gray-400'>
                      {user.email}
                    </p>
                    {user.department_name && (
                      <p className='text-xs text-gray-400 dark:text-gray-500'>
                        {user.department_name}
                      </p>
                    )}
                  </div>

                  {/* Select button */}
                  {onUserSelect && (
                    <div className='flex-shrink-0'>
                      <Button size='xs' color='blue'>
                        Select
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {(searchTerm ? searchResults : users).length === 0 && (
            <div className='p-8 text-center'>
              <p className='text-gray-500 dark:text-gray-400'>
                {searchTerm
                  ? 'No users found matching your search.'
                  : 'No users found.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserListComponent;
