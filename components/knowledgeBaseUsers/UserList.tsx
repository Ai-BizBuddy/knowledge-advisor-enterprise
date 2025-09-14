'use client';

import { useToast } from '@/components/toast';
import { useKnowledgeBaseUsers } from '@/hooks/useKnowledgeBaseUsers';
import {
  KNOWLEDGE_BASE_ROLE_OPTIONS,
  KnowledgeBaseRole,
  KnowledgeBaseUser,
} from '@/interfaces/KnowledgeBaseUserRole';
import { Badge, Button, Modal, Spinner } from 'flowbite-react';
import Image from 'next/image';
import React, { useState } from 'react';

interface UserListProps {
  knowledgeBaseId: string;
  users: KnowledgeBaseUser[];
  loading: boolean;
  onRefresh: () => void;
}

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: KnowledgeBaseUser | null;
  onUpdate: (userId: string, role: KnowledgeBaseRole) => Promise<void>;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdate,
}) => {
  const { showToast } = useToast();
  const [selectedRole, setSelectedRole] = useState<KnowledgeBaseRole>(
    user?.role || KnowledgeBaseRole.VIEWER,
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!user) return;

    setIsUpdating(true);
    setError(null);
    try {
      await onUpdate(user.id, selectedRole);
      showToast('User role updated successfully', 'success');
      onClose();
    } catch (error) {
      let errorMessage = 'Failed to update user role. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes('permission')) {
          errorMessage = "You don't have permission to update this user's role";
        } else if (error.message.toLowerCase().includes('not found')) {
          errorMessage = 'User not found. They may have been removed from the knowledge base.';
        } else if (error.message.toLowerCase().includes('network') || 
                   error.message.toLowerCase().includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.toLowerCase().includes('unauthorized')) {
          errorMessage = 'You are not authorized to perform this action';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Reset error when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedRole(user?.role || KnowledgeBaseRole.VIEWER);
    }
  }, [isOpen, user?.role]);

  if (!user) return null;

  return (
    <Modal show={isOpen} onClose={onClose} size='md'>
      <div className='p-6'>
        <div className='mb-6'>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
            Edit User Role
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Update role for {user.email}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className='mb-4 rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-600 dark:bg-red-900/20'>
            <div className='flex items-center'>
              <div className='flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-800'>
                <svg
                  className='h-3 w-3 text-red-600 dark:text-red-300'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <p className='text-sm text-red-800 dark:text-red-300'>{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className='space-y-4'>
          <div className='flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700'>
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
                {(user.display_name || user.email)[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className='font-medium text-gray-900 dark:text-white'>
                {user.display_name || user.email}
              </div>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                {user.email}
              </div>
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) =>
                setSelectedRole(e.target.value as KnowledgeBaseRole)
              }
              className='mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500'
            >
              {KNOWLEDGE_BASE_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          <div className='flex justify-end gap-3 pt-4'>
            <Button color='gray' onClick={onClose} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating || selectedRole === user.role}
            >
              {isUpdating ? (
                <>
                  <Spinner size='sm' className='mr-2' />
                  Updating...
                </>
              ) : (
                'Update Role'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const UserList: React.FC<UserListProps> = ({
  knowledgeBaseId,
  users,
  loading,
  onRefresh,
}) => {
  const { showToast } = useToast();
  const { updateUserRole, removeUser } = useKnowledgeBaseUsers();
  const [editingUser, setEditingUser] = useState<KnowledgeBaseUser | null>(
    null,
  );
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const getRoleBadgeColor = (role: KnowledgeBaseRole) => {
    switch (role) {
      case KnowledgeBaseRole.SUPER_ADMIN:
        return 'failure';
      case KnowledgeBaseRole.ADMIN:
        return 'warning';
      case KnowledgeBaseRole.EDITOR:
        return 'info';
      case KnowledgeBaseRole.CONTRIBUTOR:
        return 'purple';
      case KnowledgeBaseRole.VIEWER:
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getRoleLabel = (role: KnowledgeBaseRole) => {
    const option = KNOWLEDGE_BASE_ROLE_OPTIONS.find(
      (opt) => opt.value === role,
    );
    return option?.label || role;
  };

  const handleUpdateRole = async (userId: string, role: KnowledgeBaseRole) => {
    try {
      await updateUserRole(userId, knowledgeBaseId, { role });
      onRefresh();
    } catch (error) {
      // Error handling is done in the EditUserModal, 
      // but we still need to refresh to ensure UI is in sync
      onRefresh();
      throw error; // Re-throw to let the modal handle it
    }
  };

  const handleRemoveUser = async (userId: string) => {
    setRemovingUserId(userId);
    try {
      await removeUser(userId, knowledgeBaseId);
      showToast('User removed successfully', 'success');
      onRefresh();
    } catch (error) {
      let errorMessage = 'Failed to remove user. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.toLowerCase().includes('permission')) {
          errorMessage = "You don't have permission to remove this user";
        } else if (error.message.toLowerCase().includes('not found')) {
          errorMessage = 'User not found. They may have already been removed.';
        } else if (error.message.toLowerCase().includes('network') || 
                   error.message.toLowerCase().includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.toLowerCase().includes('unauthorized')) {
          errorMessage = 'You are not authorized to perform this action';
        } else if (error.message.toLowerCase().includes('last admin')) {
          errorMessage = 'Cannot remove the last admin from the knowledge base';
        } else {
          errorMessage = error.message;
        }
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setRemovingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Spinner size='lg' />
        <span className='ml-3 text-gray-600 dark:text-gray-400'>
          Loading users...
        </span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className='py-8 text-center'>
        <div className='text-gray-500 dark:text-gray-400'>
          No users have been added to this knowledge base yet.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400'>
                User
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400'>
                Role
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400'>
                Added
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400'>
                Expires
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900'>
            {users.map((user) => (
              <tr
                key={user.id}
                className='hover:bg-gray-50 dark:hover:bg-gray-800'
              >
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex items-center gap-3'>
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
                        {(user.display_name || user.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className='text-sm font-medium text-gray-900 dark:text-white'>
                        {user.display_name || user.email}
                      </div>
                      <div className='text-sm text-gray-500 dark:text-gray-400'>
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <Badge color={getRoleBadgeColor(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                </td>
                <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400'>
                  {new Date(user.granted_at).toLocaleDateString()}
                </td>
                <td className='px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400'>
                  {user.expires_at ? (
                    new Date(user.expires_at).toLocaleDateString()
                  ) : (
                    <span className='text-gray-400'>Never</span>
                  )}
                </td>
                <td className='px-6 py-4 text-sm font-medium whitespace-nowrap'>
                  <div className='flex items-center gap-2'>
                    <Button
                      size='xs'
                      color='gray'
                      onClick={() => setEditingUser(user)}
                    >
                      Edit
                    </Button>
                    <Button
                      size='xs'
                      color='failure'
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={removingUserId === user.id}
                    >
                      {removingUserId === user.id ? (
                        <Spinner size='sm' />
                      ) : (
                        'Remove'
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onUpdate={handleUpdateRole}
      />
    </>
  );
};
