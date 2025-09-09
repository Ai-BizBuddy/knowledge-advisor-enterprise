'use client';

import { BaseButton } from '@/components/ui/BaseButton';
import { BaseModal } from '@/components/ui/BaseModal';
import { useAsyncOperation, useReactHookForm, useUserManagement } from '@/hooks';
import type { CreateUserFormProps } from './CreateUserForm.types';
import type { CreateUserInput } from '@/interfaces/UserManagement';
import { Alert, Label, Select, TextInput } from 'flowbite-react';
import React, { useEffect, useState } from 'react';

type CreateUserFormSimplifiedData = {
  email: string;
  password: string;
  display_name: string;
  department_id: string;
  role_ids: number[];
};

/**
 * Simplified Create User Form using unified hooks and Flowbite components
 */
export const CreateUserFormSimplified: React.FC<CreateUserFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  availableRoles = [],
  availableDepartments = [],
}) => {
  const { createUser, getRoles, getDepartments, roles: stateRoles, departments: stateDepartments } = useUserManagement();
  const { state: createState, execute: executeCreate } = useAsyncOperation();
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  const form = useReactHookForm<CreateUserFormSimplifiedData>({
    defaultValues: {
      email: '',
      password: '',
      display_name: '',
      department_id: '',
      role_ids: [],
    },
  });

  // Use provided roles/departments or fetch from state
  const roles = availableRoles.length > 0 ? availableRoles : stateRoles;
  const departments = availableDepartments.length > 0 ? availableDepartments : stateDepartments;

  // Load roles and departments if not provided
  useEffect(() => {
    if (isOpen && availableRoles.length === 0) {
      getRoles();
    }
    if (isOpen && availableDepartments.length === 0) {
      getDepartments();
    }
  }, [isOpen, availableRoles.length, availableDepartments.length, getRoles, getDepartments]);

  const handleSubmit = form.handleSubmit(async (data) => {
    const userData: CreateUserInput = {
      email: data.email,
      password: data.password,
      display_name: data.display_name,
      department_id: data.department_id || undefined,
      role_ids: selectedRoles,
    };

    const result = await executeCreate(createUser, userData);
    if (result) {
      // Type assertion since createUser should return User but hook returns unknown
      onSuccess?.(result as never);
      handleClose();
    }
  });

  const handleClose = () => {
    form.reset();
    setSelectedRoles([]);
    onClose();
  };

  const handleRoleChange = (roleId: number, checked: boolean) => {
    if (checked) {
      const newRoles = [...selectedRoles, roleId];
      setSelectedRoles(newRoles);
      form.setValue('role_ids', newRoles);
    } else {
      const newRoles = selectedRoles.filter(id => id !== roleId);
      setSelectedRoles(newRoles);
      form.setValue('role_ids', newRoles);
    }
  };

  return (
    <BaseModal
      show={isOpen}
      onClose={handleClose}
      title='Create New User'
      description='Add a new user to the system'
      size='2xl'
      footer={
        <div className='flex justify-end gap-3'>
          <BaseButton variant='ghost' onClick={handleClose} disabled={createState.loading}>
            Cancel
          </BaseButton>
          <BaseButton 
            variant='primary' 
            onClick={handleSubmit}
            disabled={createState.loading || !form.formState.isValid}
          >
            {createState.loading ? 'Creating...' : 'Create User'}
          </BaseButton>
        </div>
      }
    >
      {createState.error && (
        <Alert color='failure' className='mb-4'>
          <div className='flex items-center gap-2'>
            <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z' clipRule='evenodd' />
            </svg>
            <span>{createState.error}</span>
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Email Field */}
        <div>
          <Label htmlFor='email' className='mb-2 block'>
            Email *
          </Label>
          <TextInput
            id='email'
            type='email'
            placeholder='user@example.com'
            {...form.register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            color={form.formState.errors.email ? 'failure' : 'gray'}
          />
          {form.formState.errors.email && (
            <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <Label htmlFor='password' className='mb-2 block'>
            Password *
          </Label>
          <TextInput
            id='password'
            type='password'
            placeholder='Enter password'
            {...form.register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            color={form.formState.errors.password ? 'failure' : 'gray'}
          />
          {form.formState.errors.password && (
            <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        {/* Display Name Field */}
        <div>
          <Label htmlFor='display_name' className='mb-2 block'>
            Display Name *
          </Label>
          <TextInput
            id='display_name'
            type='text'
            placeholder='John Doe'
            {...form.register('display_name', {
              required: 'Display name is required',
              minLength: {
                value: 2,
                message: 'Display name must be at least 2 characters',
              },
            })}
            color={form.formState.errors.display_name ? 'failure' : 'gray'}
          />
          {form.formState.errors.display_name && (
            <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
              {form.formState.errors.display_name.message}
            </p>
          )}
        </div>

        {/* Department Field */}
        <div>
          <Label htmlFor='department_id' className='mb-2 block'>
            Department
          </Label>
          <Select
            id='department_id'
            {...form.register('department_id')}
          >
            <option value=''>Select Department (Optional)</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Roles Section */}
        <div>
          <Label className='mb-2 block'>
            Roles *
          </Label>
          <div className='mt-2 space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-600'>
            {roles.length === 0 ? (
              <p className='text-sm text-gray-500 dark:text-gray-400'>Loading roles...</p>
            ) : (
              roles.map((role) => (
                <label key={role.id} className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={selectedRoles.includes(role.id)}
                    onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                    className='rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700'
                  />
                  <span className='text-sm text-gray-700 dark:text-gray-300'>
                    {role.name}
                    {role.description && (
                      <span className='ml-2 text-xs text-gray-500 dark:text-gray-400'>
                        - {role.description}
                      </span>
                    )}
                  </span>
                </label>
              ))
            )}
          </div>
          {selectedRoles.length === 0 && form.formState.isSubmitted && (
            <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
              At least one role must be selected
            </p>
          )}
        </div>
      </form>
    </BaseModal>
  );
};
