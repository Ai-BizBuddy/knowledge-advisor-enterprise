'use client';

import { CreateProjectInput } from '@/interfaces/Project';
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectInput) => void;
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
            className='text-gray-400 hover:text-gray-600 dark:hover:text-white'
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ name, description, status, visibility });
            onClose();
            setName('');
            setDescription('');
            setStatus(1);
            setVisibility('private');
          }}
          className='space-y-4'
        >
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

          {/* Status Field */}
         
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
              <option disabled>Draft (Not yet active)</option>
              <option value={'public'}>Public</option>
              <option value={'private'}>Private</option>
              <option value={'department'}>Department</option>
              <option value={'custom'}>Custom</option>
            </select>
            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
              You can change this status later from the knowledge base settings.
            </p>
          </div>

           <div>
            <label className='mb-3 block text-sm font-medium'>
              Initial Status *
            </label>
            <span className='inline-flex items-center cursor-pointer'>
              <input 
                type='checkbox' 
                className='sr-only peer' 
                checked={status === 1}
                onChange={(e) => setStatus(e.target.checked ? 1 : 2)}
              />
              <div 
                className='relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600'
                onClick={() => setStatus(status === 1 ? 2 : 1)}
              ></div>
              <span className='ms-3 text-sm font-medium text-gray-900 dark:text-gray-300'>
                {status === 1 ? 'Active' : 'Inactive'}
              </span>
            </span>
            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
              You can change this status later from the knowledge base settings.
            </p>
          </div>

          {/* Footer buttons */}
          <div className='flex justify-end gap-2 pt-4'>
            <button
              type='button'
              onClick={() => {
                onClose();
                setName('');
                setDescription('');
                setStatus(1);
                setVisibility('private');
              }}
              className='rounded-md bg-gray-200 px-4 py-2 text-gray-900 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700'
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
