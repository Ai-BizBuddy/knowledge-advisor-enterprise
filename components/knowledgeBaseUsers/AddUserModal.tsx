'use client';

import { useReactHookForm } from '@/hooks';
import { useKnowledgeBaseUsers } from '@/hooks/useKnowledgeBaseUsers';
import {
    KNOWLEDGE_BASE_ROLE_OPTIONS,
    KnowledgeBaseRole,
} from '@/interfaces/KnowledgeBaseUserRole';
import {
    Button,
    Label,
    Modal,
    Select,
    Spinner,
    TextInput,
} from 'flowbite-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import type {
    AddUserFormData,
    AddUserModalProps,
    SearchUserResult,
} from './AddUserModal.types';

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  knowledgeBaseId,
  onSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<SearchUserResult | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    searchUsers,
    searchResults,
    searchLoading,
    addUser,
    error,
    clearError,
  } = useKnowledgeBaseUsers();

  const form = useReactHookForm<AddUserFormData>({
    defaultValues: {
      selectedUserId: '',
      role: KnowledgeBaseRole.VIEWER,
      expiresAt: '',
    },
  });

  // Search users when search term changes
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers(knowledgeBaseId, searchTerm);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, knowledgeBaseId, searchUsers]);

  // Clear form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      form.reset();
      setSearchTerm('');
      setSelectedUser(null);
      clearError();
    }
  }, [isOpen, form, clearError]);

  const handleUserSelect = (user: SearchUserResult) => {
    setSelectedUser(user);
    form.setValue('selectedUserId', user.id);
    setSearchTerm(user.email);
  };

  const handleSubmit = async (data: AddUserFormData) => {
    if (!selectedUser) {
      form.setError('selectedUserId', { message: 'Please select a user' });
      return;
    }

    try {
      setIsSubmitting(true);
      clearError();

      const success = await addUser({
        user_id: data.selectedUserId,
        knowledge_base_id: knowledgeBaseId,
        role: data.role,
        expires_at: data.expiresAt || undefined,
      });

      if (success) {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Failed to add user to knowledge base:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size='md'>
      <div className='p-6'>
        <div className='mb-6'>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Add User to Knowledge Base
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Search for users and assign them roles to this knowledge base
          </p>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
          {/* User Search */}
          <div>
            <Label htmlFor='userSearch'>Search for user</Label>
            <div className='relative'>
              <TextInput
                id='userSearch'
                type='text'
                placeholder='Enter email or name to search...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full'
              />
              {searchLoading && (
                <div className='absolute top-1/2 right-3 -translate-y-1/2'>
                  <Spinner size='sm' />
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && !selectedUser && (
              <div className='mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-700'>
                {searchResults.map((user) => (
                  <motion.button
                    key={user.id}
                    type='button'
                    onClick={() => handleUserSelect(user)}
                    className='flex w-full items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-600'
                    whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                  >
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.display_name || user.email}
                        width={32}
                        height={32}
                        className='h-8 w-8 rounded-full'
                      />
                    ) : (
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-300'>
                        {(user.display_name || user.email)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className='font-medium text-gray-900 dark:text-white'>
                        {user.display_name || user.email}
                      </div>
                      {user.display_name && (
                        <div className='text-sm text-gray-500 dark:text-gray-400'>
                          {user.email}
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}

            {/* Selected User */}
            {selectedUser && (
              <div className='mt-2 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-600 dark:bg-green-900/20'>
                {selectedUser.avatar_url ? (
                  <Image
                    src={selectedUser.avatar_url}
                    alt={selectedUser.display_name || selectedUser.email}
                    width={32}
                    height={32}
                    className='h-8 w-8 rounded-full'
                  />
                ) : (
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-300 text-green-700 dark:bg-green-600 dark:text-green-300'>
                    {(selectedUser.display_name || selectedUser.email)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div className='flex-1'>
                  <div className='font-medium text-green-900 dark:text-green-100'>
                    {selectedUser.display_name || selectedUser.email}
                  </div>
                  {selectedUser.display_name && (
                    <div className='text-sm text-green-700 dark:text-green-300'>
                      {selectedUser.email}
                    </div>
                  )}
                </div>
                <button
                  type='button'
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchTerm('');
                    form.setValue('selectedUserId', '');
                  }}
                  className='text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200'
                >
                  <svg
                    className='h-4 w-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
            )}

            {form.formState.errors.selectedUserId && (
              <div className='mt-1 text-sm text-red-600 dark:text-red-400'>
                {form.formState.errors.selectedUserId.message}
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <Label htmlFor='role'>Role</Label>
            <Select
              id='role'
              {...form.register('role', { required: 'Role is required' })}
            >
              {KNOWLEDGE_BASE_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </Select>
            {form.formState.errors.role && (
              <div className='mt-1 text-sm text-red-600 dark:text-red-400'>
                {form.formState.errors.role.message}
              </div>
            )}
          </div>

          {/* Expiry Date (Optional) */}
          <div>
            <Label htmlFor='expiresAt'>Access expires (optional)</Label>
            <TextInput
              id='expiresAt'
              type='datetime-local'
              {...form.register('expiresAt')}
            />
            <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
              Leave empty for permanent access
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className='rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400'>
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className='flex justify-end gap-2 pt-4'>
            <Button color='gray' onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={!selectedUser || isSubmitting}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {isSubmitting ? (
                <>
                  <Spinner size='sm' className='mr-2' />
                  Adding...
                </>
              ) : (
                'Add User'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
