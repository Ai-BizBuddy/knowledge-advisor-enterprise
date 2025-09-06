'use client';

import { useKnowledgeBaseUsers } from '@/hooks/useKnowledgeBaseUsers';
import { Button } from 'flowbite-react';
import React, { useEffect, useState } from 'react';
import { AddUserModal, UserList } from './index';

interface UserManagementTabProps {
  knowledgeBaseId: string;
}

export const UserManagementTab: React.FC<UserManagementTabProps> = ({
  knowledgeBaseId,
}) => {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const { users, loading, error, fetchUsers, clearError } =
    useKnowledgeBaseUsers();

  // Load users when component mounts
  useEffect(() => {
    if (knowledgeBaseId) {
      fetchUsers(knowledgeBaseId);
    }
  }, [knowledgeBaseId, fetchUsers]);

  const handleRefreshUsers = () => {
    if (knowledgeBaseId) {
      fetchUsers(knowledgeBaseId);
    }
  };

  const handleUserAdded = () => {
    setIsAddUserModalOpen(false);
    handleRefreshUsers();
  };

  return (
    <div className='space-y-6'>
      {/* Header with Add User Button */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
            Knowledge Base Users
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Manage user access and roles for this knowledge base
          </p>
        </div>
        <Button
          onClick={() => setIsAddUserModalOpen(true)}
          className='bg-blue-600 hover:bg-blue-700'
        >
          Add User
        </Button>
      </div>

      {/* Error Display */}
      {error && (
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
                    onClick={handleRefreshUsers}
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
      )}

      {/* Users List */}
      <div className='rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800'>
        <UserList
          knowledgeBaseId={knowledgeBaseId}
          users={users}
          loading={loading}
          onRefresh={handleRefreshUsers}
        />
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        knowledgeBaseId={knowledgeBaseId}
        onSuccess={handleUserAdded}
      />
    </div>
  );
};
