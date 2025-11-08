/**
 * Unified User Form Modal Component
 *
 * Handles both create and edit operations with proper React Hook Form integration,
 * error handling, and validation following the project's standards.
 */

'use client';

import { useReactHookForm, useUserManagement } from '@/hooks';
import { usePaginatedUserManagement } from '@/hooks/usePaginatedUserManagement';
import type {
  CreateUserInput,
  Department,
  Role,
  UpdateUserInput,
  User,
  UserManagementError,
} from '@/interfaces/UserManagement';
import { UserStatus } from '@/interfaces/UserManagement';
import { Button, Label, Modal, Select, TextInput } from 'flowbite-react';
import React, { useEffect, useState } from 'react';

interface UserFormData extends Record<string, unknown> {
  email: string;
  password?: string;
  confirmPassword?: string;
  display_name: string;
  role_ids: number[];
  department_id?: string;
  status?: UserStatus;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  user?: User | null;
  availableRoles?: Role[];
  availableDepartments?: Department[];
  onSuccess?: (user: User) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  mode,
  user,
  availableRoles = [],
  availableDepartments = [],
  onSuccess,
}) => {
  const {
    createUser,
    updateUser,
    getRoles,
    getDepartments,
    error,
    clearError,
  } = useUserManagement();

  const { allRoles, allDepartments, getAllRoles, getAllDepartments } =
    usePaginatedUserManagement();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  // Use provided roles/departments or fetch from state
  const roles = availableRoles.length > 0 ? availableRoles : allRoles;
  const departments =
    availableDepartments.length > 0 ? availableDepartments : allDepartments;

  // Handle role checkbox changes
  const handleRoleChange = (roleId: number, checked: boolean) => {
    if (checked) {
      setSelectedRoles((prev) => [...prev, roleId]);
      form.setValue('role_ids', [...selectedRoles, roleId]);
    } else {
      setSelectedRoles((prev) => prev.filter((id) => id !== roleId));
      form.setValue(
        'role_ids',
        selectedRoles.filter((id) => id !== roleId),
      );
    }
  };

  const form = useReactHookForm<UserFormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      display_name: '',
      role_ids: [],
      department_id: '',
      status: UserStatus.ACTIVE,
    },
  });

  // Initialize form data when modal opens for editing
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && user) {
        // Initialize edit form with user data
        const userRoleIds =
          user.user_roles?.map((userRole) => userRole.role.id) ?? [];

        // Ensure display_name is properly initialized with user's display name, profile full name, or email prefix
        const displayName = user.display_name || user.profile?.full_name || user.email.split('@')[0];

        form.reset({
          email: user.email,
          display_name: displayName,
          role_ids: userRoleIds,
          department_id: user.department_id || '',
          status: user.status,
        });
        setSelectedRoles(userRoleIds);
      } else if (mode === 'create') {
        // Initialize create form with empty values
        form.reset({
          email: '',
          password: '',
          confirmPassword: '',
          display_name: '',
          role_ids: [],
          department_id: '',
          status: UserStatus.ACTIVE,
        });
        setSelectedRoles([]);
      }
      clearError();
    }
  }, [isOpen, mode, user, form, clearError]);

  // Load roles and departments if not provided and not already loaded
  useEffect(() => {
    const loadData = async () => {
      const promises: Promise<void>[] = [];

      if (roles.length === 0) {
        if (getAllRoles) {
          promises.push(getAllRoles());
        } else if (getRoles) {
          promises.push(getRoles());
        }
      }

      if (departments.length === 0) {
        if (getAllDepartments) {
          promises.push(getAllDepartments());
        } else if (getDepartments) {
          promises.push(getDepartments());
        }
      }

      if (promises.length > 0) {
        try {
          await Promise.all(promises);
        } catch (error) {
          console.error('Failed to load roles or departments:', error);
        }
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [
    isOpen,
    roles.length,
    departments.length,
    getAllRoles,
    getAllDepartments,
    getRoles,
    getDepartments,
  ]);

  const onSubmit = async (data: UserFormData) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      clearError();

      // Validate that at least one role is selected
      if (selectedRoles.length === 0) {
        form.setError('role_ids', {
          type: 'manual',
          message: 'Please select at least one role',
        });
        return;
      }

      if (mode === 'create') {
        // Validate password confirmation for create mode
        if (data.password !== data.confirmPassword) {
          form.setError('confirmPassword', {
            type: 'manual',
            message: 'Passwords do not match',
          });
          return;
        }

        // Prepare create user input
        const createUserData: CreateUserInput = {
          email: data.email.trim(),
          password: data.password!,
          display_name: data.display_name.trim() || data.email.split('@')[0],
          role_ids: selectedRoles.length > 0 ? selectedRoles : [3], // Default to basic user role if none selected
          department_id: data.department_id || undefined,
          metadata: {
            created_by: 'admin', // TODO: Get from current user context
            created_via: 'admin_panel',
          },
        };

        const newUser = await createUser(createUserData);

        if (newUser) {
          // Success - reset form and close modal
          form.reset();
          setSelectedRoles([]);
          onSuccess?.(newUser);
          onClose();
        }
      } else if (mode === 'edit' && user) {
        // Prepare update user input
        const updateUserData: UpdateUserInput = {
          email: data.email,
          display_name: data.display_name,
          role_ids: selectedRoles,
          department_id: data.department_id,
          status: data.status,
        };

        const updatedUser = await updateUser(user.id, updateUserData);

        if (updatedUser) {
          // Success - close modal
          onSuccess?.(updatedUser);
          onClose();
        }
      }
    } catch (err) {
      // Handle specific email exists error
      if (err instanceof Error) {
        const error = err as UserManagementError;
        if (error.code === 'email_exists') {
          form.setError('email', {
            type: 'manual',
            message: error.message,
          });
        } else {
          form.setError('root', {
            type: 'manual',
            message: error.message || `Failed to ${mode} user`,
          });
        }
      } else {
        form.setError('root', {
          type: 'manual',
          message: 'An unexpected error occurred',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isCreateMode = mode === 'create';
  const title = isCreateMode ? 'Create New User' : 'Edit User';
  const subtitle = isCreateMode
    ? 'Add a new user to the system with role and department assignment'
    : 'Update user information, roles, and permissions';

  return (
    <Modal show={isOpen} onClose={onClose} size='2xl' className='z-[100]'>
      <div className='relative max-h-[90vh] overflow-y-auto p-8'>
        <div className='mb-6'>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>
            {title}
          </h3>
          <p className='text-sm text-gray-500 dark:text-gray-400'>{subtitle}</p>
        </div>

        <div className='relative space-y-6'>
          {/* Global error message */}
          {error && (
            <div className='rounded-lg bg-red-100 p-3 text-sm text-red-600 dark:bg-red-900 dark:text-red-300'>
              {error}
            </div>
          )}

          {/* Root form error */}
          {form.formState.errors.root && (
            <div className='rounded-lg bg-red-100 p-3 text-sm text-red-600 dark:bg-red-900 dark:text-red-300'>
              {form.formState.errors.root.message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* Basic Information Section */}
            <div className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                {/* Email Field */}
                <div>
                  <Label htmlFor='email' className='mb-2 block'>
                    Email Address *
                  </Label>
                  <TextInput
                    id='email'
                    type='email'
                    placeholder='user@example.com'
                    {...form.register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Please enter a valid email address',
                      },
                    })}
                    color={form.formState.errors.email ? 'failure' : 'gray'}
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.email && (
                    <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                {/* Display Name Field */}
                <div>
                  <Label htmlFor='display_name' className='mb-2 block'>
                    Display Name
                  </Label>
                  <TextInput
                    id='display_name'
                    type='text'
                    placeholder='Display name'
                    {...form.register('display_name', {
                      minLength: {
                        value: 2,
                        message: 'Display name must be at least 2 characters',
                      },
                      maxLength: {
                        value: 100,
                        message:
                          'Display name must be less than 100 characters',
                      },
                    })}
                    color={
                      form.formState.errors.display_name ? 'failure' : 'gray'
                    }
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.display_name && (
                    <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                      {form.formState.errors.display_name.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Password fields only for create mode */}
              {isCreateMode && (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                  {/* Password Field */}
                  <div>
                    <Label htmlFor='password' className='mb-2 block'>
                      Password *
                    </Label>
                    <TextInput
                      id='password'
                      type='password'
                      placeholder='••••••••'
                      {...form.register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters',
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message:
                            'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                        },
                      })}
                      color={
                        form.formState.errors.password ? 'failure' : 'gray'
                      }
                      disabled={isSubmitting}
                    />
                    {form.formState.errors.password && (
                      <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                        {form.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <Label htmlFor='confirmPassword' className='mb-2 block'>
                      Confirm Password *
                    </Label>
                    <TextInput
                      id='confirmPassword'
                      type='password'
                      placeholder='••••••••'
                      {...form.register('confirmPassword', {
                        required: 'Please confirm your password',
                      })}
                      color={
                        form.formState.errors.confirmPassword
                          ? 'failure'
                          : 'gray'
                      }
                      disabled={isSubmitting}
                    />
                    {form.formState.errors.confirmPassword && (
                      <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                        {form.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Roles & Permissions Section */}
            <div className='space-y-4'>
              {/* Multiple Role Selection */}
              <div>
                <Label className='mb-3 block'>User Roles *</Label>
                <div className='relative max-h-32 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700'>
                  {roles.length === 0 ? (
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      Loading roles...
                    </p>
                  ) : (
                    roles.map((role) => (
                      <div
                        key={role.id}
                        className='relative flex items-start space-x-3 rounded-md bg-white p-3 shadow-sm dark:bg-gray-800'
                      >
                        <input
                          type='checkbox'
                          id={`role-${role.id}`}
                          checked={selectedRoles.includes(role.id)}
                          onChange={(e) =>
                            handleRoleChange(role.id, e.target.checked)
                          }
                          className='mt-1 h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600'
                          disabled={isSubmitting}
                        />
                        <div className='flex-1'>
                          <label
                            htmlFor={`role-${role.id}`}
                            className='cursor-pointer text-sm font-medium text-gray-900 dark:text-gray-300'
                          >
                            {role.name}
                          </label>
                          {role.description && (
                            <p className='text-xs text-gray-500 dark:text-gray-400'>
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {form.formState.errors.role_ids && (
                  <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                    {form.formState.errors.role_ids.message}
                  </p>
                )}
              </div>
            </div>

            {/* Department & Status Section */}
            <div className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                {/* Department Selection */}
                <div>
                  <Label htmlFor='department_id' className='mb-2 block'>
                    Department
                  </Label>
                  <Select
                    id='department_id'
                    {...form.register('department_id')}
                    color={
                      form.formState.errors.department_id ? 'failure' : 'gray'
                    }
                    disabled={isSubmitting}
                  >
                    <option value=''>Select a department (optional)</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                        {department.description
                          ? ` - ${department.description}`
                          : ''}
                      </option>
                    ))}
                  </Select>
                  {form.formState.errors.department_id && (
                    <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                      {form.formState.errors.department_id.message}
                    </p>
                  )}
                </div>

                {/* Status Selection (only for edit mode) */}
                {!isCreateMode && (
                  <div>
                    <Label htmlFor='status' className='mb-2 block'>
                      Account Status
                    </Label>
                    <Select
                      id='status'
                      {...form.register('status')}
                      color={form.formState.errors.status ? 'failure' : 'gray'}
                      disabled={isSubmitting}
                    >
                      <option value={UserStatus.ACTIVE}>Active</option>
                      <option value={UserStatus.INACTIVE}>Inactive</option>
                      <option value={UserStatus.SUSPENDED}>Suspended</option>
                      <option value={UserStatus.PENDING}>Pending</option>
                    </Select>
                    {form.formState.errors.status && (
                      <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                        {form.formState.errors.status.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className='flex justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700'>
              <Button
                type='button'
                color='gray'
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                color='blue'
                disabled={isSubmitting || selectedRoles.length === 0}
              >
                {isSubmitting ? (
                  <div className='flex items-center'>
                    <svg
                      className='mr-2 h-4 w-4 animate-spin'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      />
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      />
                    </svg>
                    {isCreateMode ? 'Creating...' : 'Updating...'}
                  </div>
                ) : isCreateMode ? (
                  'Create User'
                ) : (
                  'Update User'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};
