'use client';

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
  const [selectedRole, setSelectedRole] = useState<KnowledgeBaseRole>(
    user?.role || KnowledgeBaseRole.VIEWER,
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      await onUpdate(user.id, selectedRole);
      onClose();
    } catch (error) {
          } finally {
      setIsUpdating(false);
    }
  };

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
    await updateUserRole(userId, knowledgeBaseId, { role });
    onRefresh();
  };

  const handleRemoveUser = async (userId: string) => {
    setRemovingUserId(userId);
    try {
      await removeUser(userId, knowledgeBaseId);
      onRefresh();
    } catch (error) {
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
