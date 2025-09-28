'use client';

import { Project, ProjectStatus, UpdateProjectInput } from '@/interfaces/Project';
import { useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: UpdateProjectInput) => void;
  project: Project | null;
}

export default function EditKnowledgeBaseModal({
  isOpen,
  onClose,
  onSubmit,
  project,
}: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<number>(ProjectStatus.ACTIVE);
  const [visibility, setVisibility] = useState<
    'public' | 'private' | 'department' | 'custom'
  >('private');

  // Pre-fill form with existing project data
  useEffect(() => {
    if (project && isOpen) {
      setName(project.name || '');
      setDescription(project.description || '');
      setStatus(project.is_active === true ? ProjectStatus.ACTIVE : ProjectStatus.INACTIVE);
      setVisibility(project.visibility as 'public' | 'private' | 'department' | 'custom' || 'private');
    }
  }, [project, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setStatus(ProjectStatus.ACTIVE);
      setVisibility('private');
    }
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData: UpdateProjectInput = {};
    
    // Only include fields that have changed
    if (name !== project.name) updateData.name = name;
    if (description !== project.description) updateData.description = description;
    if (status !== project.status) updateData.is_active = status as ProjectStatus;
    if (visibility !== project.visibility) updateData.visibility = visibility;

    onSubmit(project.id, updateData);
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-[6%] sm:p-0'>
      <div className='w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white'>
        {/* Header */}
        <div className='mb-4 flex items-start justify-between'>
          <div>
            <h2 className='text-lg font-bold'>Edit Knowledge Base</h2>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Update your knowledge repository settings
            </p>
          </div>
          <button
            className='text-gray-400 hover:text-gray-600 dark:hover:text-white'
            onClick={onClose}
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
              className='w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white'
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
              className='w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white'
              placeholder='Describe what this knowledge base will contain and its purpose...'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Visibility Field */}
          <div>
            <label className='mb-1 block text-sm font-medium'>
              Visibility *
            </label>
            <select
              required
              className='w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white'
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
              <option value='public'>Public</option>
              <option value='private'>Private</option>
              <option value='department'>Department</option>
              <option value='custom'>Custom</option>
            </select>
            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
              Control who can access this knowledge base.
            </p>
          </div>

          {/* Status Field */}
          <div>
            <label className='mb-3 block text-sm font-medium'>
              Status *
            </label>
            <span className='inline-flex items-center cursor-pointer'>
              <input 
                type='checkbox' 
                className='sr-only peer' 
                checked={status === ProjectStatus.ACTIVE}
                onChange={(e) => setStatus(e.target.checked ? ProjectStatus.ACTIVE : ProjectStatus.INACTIVE)}
              />
              <div 
                className='relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600'
                onClick={() => setStatus(status === ProjectStatus.ACTIVE ? ProjectStatus.INACTIVE : ProjectStatus.ACTIVE)}
              ></div>
              <span className='ms-3 text-sm font-medium text-gray-900 dark:text-gray-300'>
                {status === ProjectStatus.ACTIVE ? 'Active' : 'Inactive'}
              </span>
            </span>
            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
              Inactive knowledge bases won&apos;t be accessible to users.
            </p>
          </div>

          {/* Footer buttons */}
          <div className='flex justify-end gap-2 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-md bg-gray-200 px-4 py-2 text-gray-900 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700'
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}