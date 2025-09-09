'use client';

import { BaseButton } from '@/components/ui/BaseButton';
import { BaseModal } from '@/components/ui/BaseModal';
import { BaseProgress } from '@/components/ui/BaseProgress';
import { BaseStatusBadge } from '@/components/ui/BaseStatusBadge';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Button } from 'flowbite-react';
import React, { useEffect } from 'react';

export interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => Promise<void>;
  title?: string;
  description?: string;
  maxFiles?: number;
  maxSize?: number;
  supportedTypes?: string[];
  supportedExtensions?: string[];
  autoCloseOnSuccess?: boolean;
}

/**
 * Unified File Upload Modal using Flowbite components and consolidated logic
 */
export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  title = 'Upload Files',
  description = 'Select files to upload',
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  supportedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ],
  supportedExtensions = ['pdf', 'doc', 'docx', 'txt', 'md', 'xlsx', 'xls'],
  autoCloseOnSuccess = true,
}) => {
  const {
    fileStates,
    error,
    isUploading,
    inputRef,
    handleFiles,
    removeFile,
    clearAll,
    getFileIcon,
    startUpload,
  } = useFileUpload({
    maxFiles,
    maxSize,
    supportedTypes,
    supportedExtensions,
  });

  const handleUpload = async () => {
    await startUpload(onUpload);
  };

  const handleClose = () => {
    if (!isUploading) {
      clearAll();
      onClose();
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Auto-close on success
  useEffect(() => {
    if (autoCloseOnSuccess && fileStates.length > 0 && fileStates.every(f => f.status === 'success')) {
      setTimeout(() => {
        if (!isUploading) {
          clearAll();
          onClose();
        }
      }, 1500);
    }
  }, [fileStates, autoCloseOnSuccess, isUploading, clearAll, onClose]);

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        // Error will be cleared by the hook
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!isOpen) return null;

  const filesToUpload = fileStates.filter(f => f.status === 'waiting' || f.status === 'error');
  const allSuccessful = fileStates.length > 0 && fileStates.every(f => f.status === 'success');
  const hasErrors = fileStates.some(f => f.status === 'error');

  return (
    <BaseModal
      show={isOpen}
      onClose={handleClose}
      title={title}
      description={description}
      size='4xl'
      bodyClassName='max-h-[60vh] overflow-y-auto px-6 pb-6'
      footer={
        fileStates.length > 0 && (
          <div className='flex w-full items-center justify-between'>
            <div className='flex items-center gap-4'>
              <span className='text-sm text-gray-600 dark:text-slate-400'>
                {fileStates.length} of {maxFiles} files selected
              </span>
              
              {isUploading && (
                <div className='flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400'>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400'></div>
                  <span>Uploading files...</span>
                </div>
              )}
              
              {allSuccessful && !isUploading && (
                <BaseStatusBadge status='success'>
                  Upload complete!
                </BaseStatusBadge>
              )}
              
              {hasErrors && !isUploading && (
                <BaseStatusBadge status='error'>
                  {fileStates.filter(f => f.status === 'error').length} file(s) failed
                </BaseStatusBadge>
              )}
            </div>
            
            <div className='flex gap-3'>
              <BaseButton 
                variant='ghost' 
                onClick={clearAll} 
                disabled={isUploading}
              >
                Clear All
              </BaseButton>
              
              <BaseButton
                variant='primary'
                onClick={handleUpload}
                disabled={isUploading || filesToUpload.length === 0}
              >
                {isUploading ? (
                  <div className='flex items-center gap-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                    Uploading...
                  </div>
                ) : allSuccessful ? (
                  'Complete!'
                ) : hasErrors ? (
                  'Retry Failed'
                ) : (
                  'Upload Files'
                )}
              </BaseButton>
            </div>
          </div>
        )
      }
    >
      {/* Error Display */}
      {error && (
        <div className='mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'>
          <div className='flex items-center gap-2'>
            <svg className='h-4 w-4 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z' clipRule='evenodd' />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Upload Area or File List */}
      {fileStates.length === 0 ? (
        <div
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-all duration-300 hover:border-gray-400 hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700/30 dark:hover:border-slate-500 dark:hover:bg-slate-700/50 ${
            isUploading ? 'pointer-events-none opacity-50' : ''
          }`}
          onDrop={isUploading ? undefined : onDrop}
          onDragOver={isUploading ? undefined : (e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type='file'
            multiple
            accept={supportedExtensions.map(ext => `.${ext}`).join(',')}
            className='hidden'
            onChange={onFileChange}
            disabled={isUploading}
          />
          
          <div className='space-y-4'>
            <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-600/50'>
              <svg className='h-8 w-8 text-gray-500 dark:text-slate-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'></path>
              </svg>
            </div>
            <div>
              <h3 className='mb-2 text-lg font-medium text-gray-800 dark:text-slate-200'>
                Click to upload or drag and drop
              </h3>
              <p className='text-sm text-gray-600 dark:text-slate-400'>
                {supportedExtensions.map(ext => ext.toUpperCase()).join(', ')} (MAX. {(maxSize / 1024 / 1024).toFixed(0)}MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className='space-y-4'>
          {/* File List */}
          {fileStates.map((fileState) => (
            <div key={fileState.id} className='flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-600/30 dark:bg-slate-700/30'>
              <div className='flex-shrink-0'>{getFileIcon(fileState.file.name)}</div>
              
              <div className='min-w-0 flex-1'>
                <div className='mb-2 flex items-center justify-between'>
                  <h4 className='truncate text-sm font-medium text-gray-900 dark:text-slate-200'>
                    {fileState.file.name}
                  </h4>
                  
                  <div className='flex items-center gap-2'>
                    <BaseStatusBadge status={fileState.status} />
                    
                    {(fileState.status === 'waiting' || fileState.status === 'error') && (
                      <Button
                        size='xs'
                        color='gray'
                        onClick={() => removeFile(fileState.id)}
                        className='p-1'
                      >
                        <svg className='h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
                        </svg>
                      </Button>
                    )}
                  </div>
                </div>
                
                <p className='mb-2 text-sm text-gray-500 dark:text-slate-400'>
                  {(fileState.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
                
                {(fileState.status === 'uploading' || fileState.status === 'success' || fileState.status === 'error') && (
                  <BaseProgress
                    progress={fileState.status === 'error' ? 100 : fileState.progress}
                    color={fileState.status === 'success' ? 'green' : fileState.status === 'error' ? 'red' : 'blue'}
                    showPercentage={fileState.status === 'uploading'}
                  />
                )}
                
                {fileState.status === 'error' && fileState.error && (
                  <p className='mt-2 text-xs text-red-600 dark:text-red-400'>{fileState.error}</p>
                )}
              </div>
            </div>
          ))}
          
          {/* Add More Files */}
          {fileStates.length < maxFiles && (
            <div
              className={`relative cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 text-center transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-600 dark:bg-slate-700/20 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 ${
                isUploading ? 'pointer-events-none opacity-50' : ''
              }`}
              onDrop={isUploading ? undefined : onDrop}
              onDragOver={isUploading ? undefined : (e) => e.preventDefault()}
              onClick={() => inputRef.current?.click()}
            >
              <div className='flex flex-col items-center gap-2'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
                  <svg className='h-4 w-4 text-blue-600 dark:text-blue-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 4v16m8-8H4' />
                  </svg>
                </div>
                <span className='text-sm font-medium text-blue-600 dark:text-blue-400'>
                  + Add more files
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </BaseModal>
  );
};
