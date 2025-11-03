'use client';

import { API_CONSTANTS } from '@/constants';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef, useState } from 'react';

// Types
export type FileUploadStatus =
  | 'waiting'
  | 'uploading'
  | 'success'
  | 'error'
  | 'cancelled';

export interface FileUploadItem {
  id: string;
  file: File;
  status: FileUploadStatus;
  progress: number; // 0 - 100
  error?: string;
}

export interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void; // Triggered when user clicks Cancel / closes modal
  initialFiles?: File[]; // Optional initial files
  files?: File[]; // Controlled files list (alternative to drag/drop)
  onUpload?: (files: File[]) => Promise<void> | void; // Called when user presses Upload files (receives all pending files)
  onSuccess?: (fileId: string) => void; // Per-file success callback
  onError?: (fileId: string, error: Error | string) => void; // Per-file error callback
  onCancel?: (fileId: string) => void; // Per-file cancel callback
  accept?: string; // input accept rule
  maxFiles?: number;
  maxSizeBytes?: number; // per file
  simulateProgress?: boolean; // if true, we animate progress automatically
  autoClearOnSuccess?: boolean; // if true, close after all success
  className?: string;
  dropzoneClassName?: string;
}

// Default constraints
const DEFAULT_MAX_FILES = 10;
const DEFAULT_MAX_SIZE = API_CONSTANTS.MAX_FILE_SIZE;
const DEFAULT_ACCEPT =
  '.svg,.png,.jpg,.gif,.pdf,.doc,.docx,.txt,.md,.xlsx,.xls,.zip';

const createItem = (file: File): FileUploadItem => ({
  id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  file,
  status: 'waiting',
  progress: 0,
});

// Utility for formatting file size
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
};

// Get file icon based on file extension
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  switch (ext) {
    case 'zip':
      return (
        <div className='flex h-8 w-8 items-center justify-center rounded bg-yellow-500'>
          <svg
            className='h-5 w-5 text-white'
            fill='currentColor'
            viewBox='0 0 20 20'
            aria-hidden='true'
          >
            <path
              fillRule='evenodd'
              d='M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm3 5a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm3 0a1 1 0 000 2h.01a1 1 0 100-2H13z'
              clipRule='evenodd'
            />
          </svg>
        </div>
      );
    case 'txt':
    case 'md':
      return (
        <div className='flex h-8 w-8 items-center justify-center rounded bg-gray-500'>
          <svg
            className='h-5 w-5 text-white'
            fill='currentColor'
            viewBox='0 0 20 20'
            aria-hidden='true'
          >
            <path
              fillRule='evenodd'
              d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z'
              clipRule='evenodd'
            />
          </svg>
        </div>
      );
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return (
        <div className='flex h-8 w-8 items-center justify-center rounded bg-purple-500'>
          <svg
            className='h-5 w-5 text-white'
            fill='currentColor'
            viewBox='0 0 20 20'
            aria-hidden='true'
          >
            <path
              fillRule='evenodd'
              d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z'
              clipRule='evenodd'
            />
          </svg>
        </div>
      );
    default:
      return (
        <div className='flex h-8 w-8 items-center justify-center rounded bg-gray-500'>
          <svg
            className='h-5 w-5 text-white'
            fill='currentColor'
            viewBox='0 0 20 20'
            aria-hidden='true'
          >
            <path
              fillRule='evenodd'
              d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z'
              clipRule='evenodd'
            />
          </svg>
        </div>
      );
  }
};

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  initialFiles,
  files: controlledFiles,
  onUpload,
  onCancel,
  onSuccess,
  onError,
  accept = DEFAULT_ACCEPT,
  maxFiles = DEFAULT_MAX_FILES,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  simulateProgress = true,
  autoClearOnSuccess = false,
  className = '',
  dropzoneClassName = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<FileUploadItem[]>(() =>
    (initialFiles || []).map(createItem),
  );
  const [isDragOver, setIsDragOver] = useState(false);

  // Merge with controlled files if provided
  useEffect(() => {
    if (controlledFiles) {
      setItems(controlledFiles.map(createItem));
    }
  }, [controlledFiles]);

  const setItem = (id: string, updates: Partial<FileUploadItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    );
  };

  const validateFiles = (files: File[]): string | null => {
    if (files.length + items.length > maxFiles)
      return `You can upload up to ${maxFiles} files.`;
    for (const file of files) {
      if (file.size > maxSizeBytes)
        return `${file.name} exceeds ${(maxSizeBytes / 1024 / 1024).toFixed(0)}MB limit.`;
    }
    return null;
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const arr = Array.from(fileList);
    const err = validateFiles(arr);
    if (err) {
            return;
    }
    setItems((prev) => [...prev, ...arr.map(createItem)]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleBrowse = () => inputRef.current?.click();

  const beginSimulatedProgress = useCallback(
    (item: FileUploadItem) => {
      if (!simulateProgress) return;
      let progress = 0;
      const tick = () => {
        progress += Math.random() * 15 + 5; // random increment 5-20%
        if (progress >= 100) progress = 100;
        setItem(item.id, { progress });
        if (progress < 100) {
          // Use a ref or state check instead of stale closure
          setItems((currentItems) => {
            const currentItem = currentItems.find((i) => i.id === item.id);
            if (currentItem?.status === 'uploading') {
              setTimeout(tick, 200 + Math.random() * 300); // 200-500ms intervals
            }
            return currentItems;
          });
        }
      };
      tick();
    },
    [simulateProgress],
  );

  const uploadSingle = async (item: FileUploadItem) => {
    try {
      setItem(item.id, { status: 'uploading', progress: 0, error: undefined });
      beginSimulatedProgress(item);

      // Simulate upload time based on file size
      const uploadTime = Math.min(
        2000 + (item.file.size / 1024 / 1024) * 100,
        5000,
      );
      await new Promise((r) => setTimeout(r, uploadTime));

      // Check if item was cancelled during upload using callback state
      let wasCancelled = false;
      setItems((currentItems) => {
        const currentItem = currentItems.find((i) => i.id === item.id);
        if (currentItem?.status === 'cancelled') {
          wasCancelled = true;
        }
        return currentItems;
      });

      if (wasCancelled) return;

      // Randomly simulate some failures for demo
      if (Math.random() < 0.1) {
        // 10% chance of failure
        throw new Error('Upload failed');
      }

      setItem(item.id, { status: 'success', progress: 100 });
      onSuccess?.(item.id);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Upload failed';
      setItem(item.id, { status: 'error', error: message, progress: 0 });
      onError?.(item.id, message);
    }
  };

  const handleUpload = async () => {
    const pending = items.filter(
      (i) => i.status === 'waiting' || i.status === 'error',
    );
    if (!pending.length) return;

    // Batch-level callback (consumer gets all files once)
    try {
      if (onUpload) await onUpload(pending.map((p) => p.file));
    } catch (e) {
      // Global failure: mark all as error
      const message = e instanceof Error ? e.message : 'Upload failed';
      pending.forEach((p) =>
        setItem(p.id, { status: 'error', error: message }),
      );
      return;
    }

    // Upload files individually with simulated progress
    await Promise.all(pending.map(uploadSingle));
  };

  // Auto close
  useEffect(() => {
    if (
      autoClearOnSuccess &&
      items.length &&
      items.every((i) => i.status === 'success')
    ) {
      const t = setTimeout(() => {
        onClose();
        setItems([]);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [autoClearOnSuccess, items, onClose]);

  const cancelItem = (id: string) => {
    setItems((currentItems) => {
      const item = currentItems.find((i) => i.id === id);
      if (!item) return currentItems;

      if (item.status === 'uploading') {
        setItem(id, { status: 'cancelled' });
        onCancel?.(id);
        return currentItems;
      } else {
        // Remove item if not uploading
        return currentItems.filter((i) => i.id !== id);
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`w-full max-w-2xl rounded-2xl bg-gray-800 shadow-2xl ${className}`}
        role='dialog'
        aria-modal='true'
        aria-labelledby='file-upload-title'
      >
        {/* Header */}
        <div className='px-6 py-6'>
          <h2
            id='file-upload-title'
            className='text-xl font-semibold text-white'
          >
            File upload
          </h2>
        </div>

        <div className='px-6'>
          {/* Dropzone */}
          <div
            className={`h-40 w-full rounded-xl border-2 border-dashed border-gray-500 bg-gray-700/30 transition-colors hover:border-blue-500 ${
              isDragOver ? 'border-blue-500 bg-blue-500/10' : ''
            } ${dropzoneClassName} cursor-pointer`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleBrowse}
            role='button'
            tabIndex={0}
            aria-label='Click to upload or drag and drop files'
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleBrowse();
              }
            }}
          >
            <input
              ref={inputRef}
              type='file'
              multiple
              accept={accept}
              className='hidden'
              onChange={(e) => addFiles(e.target.files)}
            />
            <div className='flex h-full flex-col items-center justify-center space-y-2'>
              {/* Upload Icon */}
              <svg
                className='h-6 w-6 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                />
              </svg>

              {/* Text */}
              <div className='text-center'>
                <span className='font-semibold text-gray-200'>
                  Click to upload
                </span>
                <span className='text-gray-400'> or drag and drop</span>
              </div>

              {/* Subtext */}
              <p className='text-sm text-gray-500'>
                SVG, PNG, JPG or GIF (MAX. 800×400px)
              </p>
            </div>
          </div>

          {/* File List */}
          {items.length > 0 && (
            <div className='mt-6 space-y-5'>
              <AnimatePresence mode='popLayout'>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className='flex items-center justify-between'>
                      {/* Left side: icon + name + size */}
                      <div className='flex items-center space-x-3'>
                        {getFileIcon(item.file.name)}
                        <div>
                          <p className='font-medium text-white'>
                            {item.file.name}
                          </p>
                          <p className='text-sm text-gray-400'>
                            {formatSize(item.file.size)}
                          </p>
                        </div>
                      </div>

                      {/* Right side: status + progress/control */}
                      <div className='flex items-center space-x-3'>
                        {/* Success state */}
                        {item.status === 'success' && (
                          <div className='flex h-6 w-6 items-center justify-center rounded-full bg-green-500'>
                            <svg
                              className='h-4 w-4 text-white'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                              aria-hidden='true'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M5 13l4 4L19 7'
                              />
                            </svg>
                          </div>
                        )}

                        {/* Uploading state */}
                        {item.status === 'uploading' && (
                          <>
                            <span className='font-medium text-white'>
                              {Math.round(item.progress)}%
                            </span>
                            <button
                              onClick={() => cancelItem(item.id)}
                              className='flex h-6 w-6 items-center justify-center rounded-full bg-gray-600 transition-colors hover:bg-gray-500'
                              aria-label='Cancel upload'
                            >
                              <svg
                                className='h-4 w-4 text-white'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                                aria-hidden='true'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M6 18L18 6M6 6l12 12'
                                />
                              </svg>
                            </button>
                          </>
                        )}

                        {/* Error state */}
                        {item.status === 'error' && (
                          <div className='flex h-6 w-6 items-center justify-center rounded-full bg-red-500'>
                            <svg
                              className='h-4 w-4 text-white'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                              aria-hidden='true'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                              />
                            </svg>
                          </div>
                        )}

                        {/* Waiting state */}
                        {item.status === 'waiting' && (
                          <button
                            onClick={() => cancelItem(item.id)}
                            className='flex h-6 w-6 items-center justify-center rounded-full bg-gray-600 transition-colors hover:bg-gray-500'
                            aria-label='Remove file'
                          >
                            <svg
                              className='h-4 w-4 text-white'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                              aria-hidden='true'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar for uploading files */}
                    {item.status === 'uploading' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className='mt-2'
                      >
                        <div className='h-1 w-full rounded-full bg-gray-600'>
                          <motion.div
                            className='h-1 rounded-full bg-blue-500'
                            initial={{ width: 0 }}
                            animate={{ width: `${item.progress}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end space-x-4 px-6 py-6'>
          <button
            onClick={onClose}
            className='rounded-xl border border-gray-600 px-5 py-2.5 text-gray-300 transition-colors hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:outline-none'
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={
              !items.some((i) => i.status === 'waiting' || i.status === 'error')
            }
            className='rounded-xl bg-blue-600 px-5 py-2.5 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
          >
            Upload files
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default FileUploadModal;
