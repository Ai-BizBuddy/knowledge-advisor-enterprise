'use client';

import { useUserManagement } from '@/hooks/useUserManagement';
import { CreateProjectInput } from '@/interfaces/Project';
import { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectInput) => Promise<void>;
}

export default function CreateKnowledgeBaseModal({
  isOpen,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<number>(1);
  const [visibility, setVisibility] = useState<
    'public' | 'private' | 'department' | 'custom'
  >('private');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get departments and user data
  const { departments, getDepartments } = useUserManagement();

  // Load departments when modal opens
  useEffect(() => {
    if (isOpen) {
      getDepartments();
    }
  }, [isOpen, getDepartments]);

  // Set default department based on user's department when visibility is set to department
  useEffect(() => {
    if (
      visibility === 'department' &&
      departments.length > 0 &&
      !departmentId
    ) {
      // You can implement logic here to get user's default department
      // For now, we'll leave it empty to force selection
    }
  }, [visibility, departments, departmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      const formData: CreateProjectInput = {
        name,
        description,
        status,
        visibility,
        ...(visibility === 'department' &&
          departmentId && { department_id: departmentId }),
      };

      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Error creating knowledge base:', error);
      // Don't close modal on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Prevent closing while submitting

    onClose();
    setName('');
    setDescription('');
    setStatus(1);
    setVisibility('private');
    setDepartmentId('');
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
      <div className='w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white'>
        {/* Header */}
        <div className='mb-4 flex items-start justify-between'>
          <div>
            <h2 className='text-lg font-bold'>Create Knowledge Base</h2>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Set up a new knowledge repository
            </p>
          </div>
          <button
            className='text-gray-400 hover:text-gray-600 disabled:opacity-50 dark:hover:text-white'
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Name Field */}
          <div>
            <label className='mb-1 block text-sm font-medium'>
              Knowledge Base Name *
            </label>
            <input
              required
              disabled={isSubmitting}
              className='w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
              placeholder='e.g., Customer Support Knowledge Base'
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description Field */}
          <div>
            <label className='mb-1 block text-sm font-medium'>
              Description *
            </label>
            <textarea
              required
              rows={3}
              disabled={isSubmitting}
              className='w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
              placeholder='Describe what this knowledge base will contain and its purpose...'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Status Field */}
          <div>
            <label className='mb-1 block text-sm font-medium'>
              Initial Status *
            </label>
            <select
              required
              disabled={isSubmitting}
              className='w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-900 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
              value={status}
              onChange={(e) => setStatus(Number(e.target.value))}
            >
              <option value={1}>Active</option>
              <option value={2}>Inactive</option>
            </select>
            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
              You can change this status later from the knowledge base settings.
            </p>
          </div>

          {/* Visibility Field */}
          <div>
            <label className='mb-1 block text-sm font-medium'>
              Visibility *
            </label>
            <select
              required
              disabled={isSubmitting}
              className='w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-900 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
              value={visibility}
              onChange={(e) =>
                setVisibility(
                  e.target.value as
                    | 'public'
                    | 'private'
                    | 'department'
                    | 'custom',
                )
              }
            >
              <option value={'private'}>Private</option>
              <option value={'public'}>Public</option>
              <option value={'department'}>Department</option>
              <option value={'custom'}>Custom</option>
            </select>
            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
              {visibility === 'private' &&
                'Only you can access this knowledge base.'}
              {visibility === 'public' &&
                'Everyone in the organization can access this knowledge base.'}
              {visibility === 'department' &&
                'Only members of the selected department can access this knowledge base.'}
              {visibility === 'custom' &&
                'Custom access rules will be applied.'}
            </p>
          </div>

          {/* Department Selection - Show only when visibility is 'department' */}
          {visibility === 'department' && (
            <div>
              <label className='mb-1 block text-sm font-medium'>
                Department *
              </label>
              <select
                required
                disabled={isSubmitting}
                className='w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-900 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value=''>Select a department</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                    {department.description
                      ? ` - ${department.description}`
                      : ''}
                  </option>
                ))}
              </select>
              <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                Choose which department can access this knowledge base.
              </p>
            </div>
          )}

          {/* Footer buttons */}
          <div className='flex justify-end gap-2 pt-4'>
            <button
              type='button'
              onClick={handleClose}
              disabled={isSubmitting}
              className='rounded-md bg-gray-200 px-4 py-2 text-gray-900 transition hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50'
            >
              {isSubmitting && (
                <svg
                  className='h-4 w-4 animate-spin'
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
              )}
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
