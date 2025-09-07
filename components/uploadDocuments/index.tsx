'use client';
import { useDocuments } from '@/hooks';
import { useParams } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

interface UploadDocumentProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface FileUploadState {
  file: File;
  status: 'waiting' | 'uploading' | 'success' | 'error' | 'cancelled';
  progress: number;
  error?: string;
  id: string;
}

export default function UploadDocument({
  isOpen,
  onClose,
}: UploadDocumentProps) {
  const [fileStates, setFileStates] = useState<FileUploadState[]>([]);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const id = params.id as string;

  const supportedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  const maxFiles = 10;
  const maxSize = 10 * 1024 * 1024; // 10MB

  const { createDocumentsFromFiles, loading } = useDocuments({
    knowledgeBaseId: id,
  });

  // Enhanced file type icons matching the design
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'pdf':
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20'>
            <svg
              className='h-6 w-6 text-red-600 dark:text-red-400'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
            </svg>
          </div>
        );
      case 'doc':
      case 'docx':
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20'>
            <svg
              className='h-6 w-6 text-blue-600 dark:text-blue-400'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
            </svg>
          </div>
        );
      case 'txt':
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800'>
            <svg
              className='h-6 w-6 text-gray-600 dark:text-gray-400'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
            </svg>
          </div>
        );
      case 'xlsx':
      case 'xls':
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20'>
            <svg
              className='h-6 w-6 text-green-600 dark:text-green-400'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
            </svg>
          </div>
        );
      case 'zip':
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20'>
            <svg
              className='h-6 w-6 text-yellow-600 dark:text-yellow-400'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
            </svg>
          </div>
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20'>
            <svg
              className='h-6 w-6 text-purple-600 dark:text-purple-400'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
            </svg>
          </div>
        );
      default:
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800'>
            <svg
              className='h-6 w-6 text-gray-600 dark:text-gray-400'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
            </svg>
          </div>
        );
    }
  };

  // Utility functions for file state management
  const createFileState = (file: File): FileUploadState => ({
    file,
    status: 'waiting',
    progress: 0,
    id: `${file.name}-${Date.now()}-${Math.random()}`,
  });

  const updateFileState = (id: string, updates: Partial<FileUploadState>) => {
    setFileStates((prev) =>
      prev.map((state) => (state.id === id ? { ...state, ...updates } : state)),
    );
  };

  const removeFileState = (id: string) => {
    setFileStates((prev) => prev.filter((state) => state.id !== id));
  };

  const cancelFileUpload = (id: string) => {
    updateFileState(id, { status: 'cancelled' });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || isUploading || loading) return;
    const arr = Array.from(files);

    if (arr.length + fileStates.length > maxFiles) {
      setError(`You can upload up to ${maxFiles} files.`);
      return;
    }

    for (const file of arr) {
      if (
        !supportedTypes.includes(file.type) &&
        !/\.(pdf|doc|docx|txt|md|xlsx|xls)$/i.test(file.name)
      ) {
        setError('Unsupported file type: ' + file.name);
        return;
      }
      if (file.size > maxSize) {
        setError(`File ${file.name} exceeds 10MB limit.`);
        return;
      }
    }

    const newFileStates = arr.map(createFileState);
    setFileStates((prev) => [...prev, ...newFileStates]);
    setError('');
  };

  const handleUpload = async () => {
    const filesToUpload = fileStates.filter(
      (state) => state.status === 'waiting' || state.status === 'error',
    );

    if (filesToUpload.length === 0) return;

    try {
      setIsUploading(true);
      setError('');

      // Set all files to uploading status
      filesToUpload.forEach((state) => {
        updateFileState(state.id, { status: 'uploading', progress: 0 });
      });

      // Upload files one by one with real progress tracking
      const uploadPromises = filesToUpload.map(async (state) => {
        try {
          // Update progress to show start
          updateFileState(state.id, { progress: 10 });

          // Simulate incremental progress for better UX
          const progressInterval = setInterval(() => {
            const currentState = fileStates.find((fs) => fs.id === state.id);
            if (currentState && currentState.progress < 90) {
              updateFileState(state.id, {
                progress: Math.min(currentState.progress + 10, 90),
              });
            }
          }, 200);

          // Call the actual upload function
          await createDocumentsFromFiles({
            knowledge_base_id: id,
            files: [state.file],
            metadata: {
              uploadSource: 'upload_modal',
              uploadedAt: new Date().toISOString(),
              totalFiles: filesToUpload.length,
            },
          });

          // Clear progress interval and set to complete
          clearInterval(progressInterval);
          updateFileState(state.id, { status: 'success', progress: 100 });
        } catch (error) {
          updateFileState(state.id, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          });
        }
      });

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // After all uploads are complete, wait a moment to show success state
      setTimeout(() => {
        // Check if all files are successful
        const currentStates = filesToUpload.map((uploadState) =>
          fileStates.find((fs) => fs.id === uploadState.id),
        );

        const allSuccessful = currentStates.every(
          (state) =>
            state &&
            (state.status === 'success' || state.status === 'cancelled'),
        );

        if (allSuccessful) {
          // Clear states and close modal
          setFileStates([]);
          setError('');
          onClose();
        }
      }, 1000); // Show success state for 1 second before closing
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to upload documents. Please try again.';
      setError(errorMessage);

      // Mark all uploading files as error
      filesToUpload.forEach((state) => {
        updateFileState(state.id, { status: 'error', error: errorMessage });
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const onBrowse = () => {
    inputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  useEffect(() => {
    if (error) {
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  }, [error]);

  // Clean up cancelled files
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setFileStates((prev) =>
        prev.filter((state) => state.status !== 'cancelled'),
      );
    }, 5000);

    return () => clearInterval(cleanupInterval);
  }, []);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm sm:p-6'>
      <div className='max-h-[90vh] w-full max-w-4xl rounded-xl border border-gray-200 bg-white text-gray-900 shadow-2xl shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white'>
        <div className='flex items-start justify-between border-b border-gray-200 dark:border-gray-700'>
          <div className='p-4 sm:p-6'>
            <h2 className='text-base font-bold text-gray-900 sm:text-lg dark:text-white'>
              {' '}
              Upload Document{' '}
            </h2>
            <p className='text-sm text-gray-600 dark:text-slate-400'>
              Upload your files here
            </p>
          </div>
          <button
            className='cursor-pointer text-gray-500 transition-colors hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
            disabled={isUploading || loading}
            onClick={() => {
              if (!isUploading && !loading) {
                onClose();
                setFileStates([]);
                setError('');
              }
            }}
          >
            <svg
              className='h-6 w-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M6 18L18 6M6 6l12 12'
              ></path>
            </svg>
          </button>
        </div>

        {/* Upload Document File area */}
        <div className='max-h-[50vh] overflow-y-auto px-6 pb-6'>
          {error && (
            <div className='mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 transition-all duration-200 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'>
              <div className='flex items-center gap-2'>
                <svg
                  className='h-4 w-4 flex-shrink-0'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
                <span className='break-words'>{error}</span>
              </div>
            </div>
          )}

          {fileStates.length === 0 ? (
            <div
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-all duration-300 hover:border-gray-400 hover:bg-gray-100 dark:border-slate-600 dark:bg-slate-700/30 dark:hover:border-slate-500 dark:hover:bg-slate-700/50 ${
                isUploading || loading ? 'pointer-events-none opacity-50' : ''
              }`}
              onDrop={isUploading || loading ? undefined : onDrop}
              onDragOver={
                isUploading || loading ? undefined : (e) => e.preventDefault()
              }
              onClick={isUploading || loading ? undefined : onBrowse}
            >
              <input
                ref={inputRef}
                type='file'
                multiple
                accept='.pdf,.doc,.docx,.txt,.md,.xlsx,.xls'
                className='hidden'
                onChange={onFileChange}
                disabled={isUploading || loading}
              />
              <div className='space-y-4'>
                <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-slate-600/50'>
                  <svg
                    className='h-8 w-8 text-gray-500 dark:text-slate-300'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='1.5'
                      d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className='mb-2 text-lg font-medium text-gray-800 dark:text-slate-200'>
                    Click to upload or drag and drop
                  </h3>
                  <p className='text-sm text-gray-600 dark:text-slate-400'>
                    SVG, PNG, JPG or GIF (MAX. 800x400px)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              {fileStates.map((fileState) => (
                <div
                  key={fileState.id}
                  className='flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all duration-200 dark:border-slate-600/30 dark:bg-slate-700/30'
                >
                  {/* File type icon */}
                  <div className='flex-shrink-0'>
                    {getFileIcon(fileState.file.name)}
                  </div>

                  <div className='min-w-0 flex-1'>
                    {/* File name and status */}
                    <div className='mb-2 flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <h4 className='truncate text-sm font-medium text-gray-900 dark:text-slate-200'>
                          {fileState.file.name}
                        </h4>
                        {fileState.status === 'success' && (
                          <div className='flex h-5 w-5 items-center justify-center rounded-full bg-green-500'>
                            <svg
                              className='h-3 w-3 text-white'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                d='M5 13l4 4L19 7'
                              />
                            </svg>
                          </div>
                        )}
                        {fileState.status === 'error' && (
                          <div className='flex h-5 w-5 items-center justify-center rounded-full bg-red-500'>
                            <svg
                              className='h-3 w-3 text-white'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth='2'
                                d='M6 18L18 6M6 6l12 12'
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className='flex flex-shrink-0 items-center gap-2'>
                        {fileState.status === 'uploading' && (
                          <span className='text-sm font-medium text-blue-600 dark:text-blue-400'>
                            {fileState.progress}%
                          </span>
                        )}
                        {fileState.status === 'error' && (
                          <span className='text-sm font-medium text-red-600 dark:text-red-400'>
                            Failed
                          </span>
                        )}
                        {fileState.status === 'success' && (
                          <span className='text-sm font-medium text-green-600 dark:text-green-400'>
                            Complete
                          </span>
                        )}

                        {/* Cancel/Remove button */}
                        {(fileState.status === 'waiting' ||
                          fileState.status === 'error' ||
                          fileState.status === 'uploading') && (
                          <button
                            className='flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-600 dark:hover:text-slate-300'
                            onClick={() => {
                              if (fileState.status === 'uploading') {
                                cancelFileUpload(fileState.id);
                              } else {
                                removeFileState(fileState.id);
                              }
                            }}
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
                                strokeWidth='2'
                                d='M6 18L18 6M6 6l12 12'
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* File size */}
                    <p className='mb-3 text-sm text-gray-500 dark:text-slate-400'>
                      {(fileState.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>

                    {/* Progress bar */}
                    {(fileState.status === 'uploading' ||
                      fileState.status === 'success' ||
                      fileState.status === 'error') && (
                      <div className='space-y-1'>
                        <div className='h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-600'>
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              fileState.status === 'success'
                                ? 'bg-green-500'
                                : fileState.status === 'error'
                                  ? 'bg-red-500'
                                  : 'bg-blue-500'
                            }`}
                            style={{
                              width:
                                fileState.status === 'error'
                                  ? '100%'
                                  : `${fileState.progress}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {fileState.status === 'error' && fileState.error && (
                      <p className='mt-2 text-xs text-red-600 dark:text-red-400'>
                        {fileState.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Add more files area */}
              {fileStates.length < maxFiles && (
                <div
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 text-center transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-600 dark:bg-slate-700/20 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 ${
                    isUploading || loading
                      ? 'pointer-events-none opacity-50'
                      : ''
                  }`}
                  onDrop={isUploading || loading ? undefined : onDrop}
                  onDragOver={
                    isUploading || loading
                      ? undefined
                      : (e: React.DragEvent) => e.preventDefault()
                  }
                  onClick={isUploading || loading ? undefined : onBrowse}
                >
                  <input
                    ref={inputRef}
                    type='file'
                    multiple
                    accept='.pdf,.doc,.docx,.txt,.md,.xlsx,.xls'
                    className='hidden'
                    onChange={onFileChange}
                    disabled={isUploading || loading}
                  />
                  <div className='flex flex-col items-center gap-2'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20'>
                      <svg
                        className='h-4 w-4 text-blue-600 dark:text-blue-400'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth='2'
                          d='M12 4v16m8-8H4'
                        />
                      </svg>
                    </div>
                    <span className='text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300'>
                      {isUploading || loading
                        ? 'Uploading...'
                        : '+ Add more files'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with upload button */}
        {fileStates.length > 0 && (
          <div className='flex items-center justify-between border-t border-gray-200 p-6 dark:border-slate-600/30'>
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

              {!isUploading &&
                fileStates.some((f) => f.status === 'success') &&
                !fileStates.some((f) => f.status === 'error') && (
                  <div className='flex items-center gap-2 text-sm text-green-600 dark:text-green-400'>
                    <div className='flex h-4 w-4 items-center justify-center rounded-full bg-green-500'>
                      <svg
                        className='h-2.5 w-2.5 text-white'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <span>Upload complete!</span>
                  </div>
                )}

              {!isUploading && fileStates.some((f) => f.status === 'error') && (
                <div className='flex items-center gap-2 text-sm text-red-600 dark:text-red-400'>
                  <div className='flex h-4 w-4 items-center justify-center rounded-full bg-red-500'>
                    <svg
                      className='h-2.5 w-2.5 text-white'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <span>
                    {fileStates.filter((f) => f.status === 'error').length}{' '}
                    file(s) failed
                  </span>
                </div>
              )}
            </div>

            <div className='flex gap-3'>
              <button
                className='rounded-lg border border-gray-300 bg-gray-50 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:focus:ring-offset-slate-800'
                disabled={isUploading || loading}
                onClick={() => {
                  setFileStates([]);
                }}
              >
                Cancel
              </button>

              <button
                className='rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                disabled={
                  isUploading ||
                  loading ||
                  fileStates.filter(
                    (s) => s.status === 'waiting' || s.status === 'error',
                  ).length === 0
                }
                onClick={handleUpload}
              >
                {isUploading || loading ? (
                  <div className='flex items-center justify-center gap-2'>
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                    <span>Uploading...</span>
                  </div>
                ) : fileStates.every((f) => f.status === 'success') ? (
                  <div className='flex items-center justify-center gap-2'>
                    <div className='flex h-4 w-4 items-center justify-center rounded-full bg-white'>
                      <svg
                        className='h-2.5 w-2.5 text-blue-600'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <span>Complete!</span>
                  </div>
                ) : fileStates.some((f) => f.status === 'error') ? (
                  <div className='flex items-center justify-center gap-2'>
                    <svg
                      className='h-4 w-4 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                      />
                    </svg>
                    <span>Retry failed</span>
                  </div>
                ) : (
                  'Upload files'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
