'use client';
import { useDocuments } from '@/hooks';
import { useParams } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface UploadDocumentModalProps {
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

export default function UploadDocumentModal({
  isOpen,
  onClose,
}: UploadDocumentModalProps) {
  const [fileStates, setFileStates] = useState<FileUploadState[]>([]);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const id = params.id as string;

  // Constants
  const { supportedTypes, maxFiles, maxSize, allowedExtensions } = React.useMemo(
    () => ({
      supportedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ],
      allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'md', 'xlsx', 'xls'],
      maxFiles: 10,
      maxSize: 10 * 1024 * 1024, // 10MB
    }),
    [],
  );

  const { createDocumentsFromFiles, loading } = useDocuments({
    knowledgeBaseId: id,
  });

  // Enhanced file type icons with colored backgrounds - Flowbite style
  const getFileTypeIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    const iconProps = {
      className: 'h-5 w-5',
      fill: 'currentColor',
      viewBox: '0 0 20 20',
    };

    switch (ext) {
      case 'pdf':
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20'>
            <svg
              {...iconProps}
              className='h-5 w-5 text-red-600 dark:text-red-400'
            >
              <path
                fillRule='evenodd'
                d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      case 'doc':
      case 'docx':
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20'>
            <svg
              {...iconProps}
              className='h-5 w-5 text-blue-600 dark:text-blue-400'
            >
              <path
                fillRule='evenodd'
                d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      case 'txt':
      case 'md':
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700'>
            <svg
              {...iconProps}
              className='h-5 w-5 text-gray-600 dark:text-gray-400'
            >
              <path
                fillRule='evenodd'
                d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      case 'xlsx':
      case 'xls':
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20'>
            <svg
              {...iconProps}
              className='h-5 w-5 text-green-600 dark:text-green-400'
            >
              <path
                fillRule='evenodd'
                d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      case 'zip':
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20'>
            <svg
              {...iconProps}
              className='h-5 w-5 text-yellow-600 dark:text-yellow-400'
            >
              <path
                fillRule='evenodd'
                d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700'>
            <svg
              {...iconProps}
              className='h-5 w-5 text-gray-600 dark:text-gray-400'
            >
              <path
                fillRule='evenodd'
                d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        );
    }
  };

  // File state management utilities
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

  // File validation
  const validateFile = useCallback(
    (file: File): string | null => {
      // Get file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      
      // Strict validation: Check if extension is in allowed list
      if (!allowedExtensions.includes(fileExtension)) {
        return `Invalid file type: ${file.name}. Only PDF, DOC, DOCX, TXT, MD, XLSX, XLS are allowed.`;
      }

      // Additional MIME type check if available
      if (
        file.type &&
        !supportedTypes.includes(file.type) &&
        !allowedExtensions.includes(fileExtension)
      ) {
        return `Invalid file type: ${file.name}. Only PDF, DOC, DOCX, TXT, MD, XLSX, XLS are allowed.`;
      }

      // File size check
      if (file.size > maxSize) {
        return `File ${file.name} exceeds ${maxSize / 1024 / 1024}MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
      }

      return null;
    },
    [maxSize, supportedTypes, allowedExtensions],
  );

  // File handling
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || isUploading || loading) return;

      const fileArray = Array.from(files);

      // Check total files limit
      if (fileArray.length + fileStates.length > maxFiles) {
        setError(`You can upload up to ${maxFiles} files at once.`);
        return;
      }

      // Validate each file
      for (const file of fileArray) {
        const validation = validateFile(file);
        if (validation) {
          setError(validation);
          return;
        }
      }

      // Add valid files
      const newFileStates = fileArray.map(createFileState);
      setFileStates((prev) => [...prev, ...newFileStates]);
      setError('');
    },
    [fileStates.length, isUploading, loading, maxFiles, validateFile],
  );

  // Upload handling
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

      // Actual file upload with real progress tracking
      await createDocumentsFromFiles(
        {
          knowledge_base_id: id,
          files: filesToUpload.map((state) => state.file),
          metadata: {
            uploadSource: 'upload_modal',
            uploadedAt: new Date().toISOString(),
            totalFiles: filesToUpload.length,
          },
        },
        (documentId, progress) => {
          // Update progress for all uploading files
          // Since we upload in parallel, distribute progress across files
          filesToUpload.forEach((state) => {
            if (state.status === 'uploading' || fileStates.find(s => s.id === state.id)?.status === 'uploading') {
              updateFileState(state.id, { progress });
            }
          });
        },
      );

      // Mark all as successful
      filesToUpload.forEach((state) => {
        updateFileState(state.id, { status: 'success', progress: 100 });
      });

      // Close modal after short delay
      setTimeout(() => {
        setFileStates([]);
        onClose();
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to upload documents. Please try again.';
      setError(errorMessage);

      // Mark all uploading files as error
      fileStates.forEach((state) => {
        if (state.status === 'uploading') {
          updateFileState(state.id, { status: 'error', error: errorMessage });
        }
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  // Click to browse
  const handleBrowse = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Clean up on close
  const handleClose = useCallback(() => {
    if (!isUploading) {
      setFileStates([]);
      setError('');
      onClose();
    }
  }, [isUploading, onClose]);

  // Auto-clear errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUploading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isUploading, handleClose]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm'>
      <div className='max-h-[90vh] w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-xl transition-all duration-200 ease-in-out dark:bg-gray-800'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
            File upload
          </h3>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className='rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300'
          >
            <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className='max-h-96 overflow-y-auto p-6'>
          {/* Error message */}
          {error && (
            <div className='mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 transition-all duration-200 dark:bg-red-900/20 dark:text-red-400'>
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
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Upload area or file list */}
          {fileStates.length === 0 ? (
            /* Upload Area */
            <div
              className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                dragActive
                  ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              } ${
                isUploading || loading
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:border-gray-400 hover:bg-gray-50 dark:hover:border-gray-500 dark:hover:bg-gray-700/50'
              }`}
              onDrag={handleDrag}
              onDragStart={handleDrag}
              onDragEnd={handleDrag}
              onDragOver={handleDragIn}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDrop={handleDrop}
              onClick={isUploading || loading ? undefined : handleBrowse}
            >
              <input
                ref={inputRef}
                type='file'
                multiple
                accept='.pdf,.doc,.docx,.txt,.md,.xlsx,.xls'
                className='hidden'
                onChange={handleFileChange}
                disabled={isUploading || loading}
              />

              <div className='space-y-2'>
                <svg
                  className='mx-auto h-12 w-12 text-gray-400'
                  stroke='currentColor'
                  fill='none'
                  viewBox='0 0 48 48'
                >
                  <path
                    d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
                    strokeWidth={2}
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                <div>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    <span className='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400'>
                      Click to upload
                    </span>{' '}
                    or drag and drop
                  </p>
                  <p className='text-xs text-gray-500 dark:text-gray-400'>
                    PDF, CSV, Word, TXT, MD
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* File List */
            <div className='space-y-3'>
              {fileStates.map((fileState) => (
                <div
                  key={fileState.id}
                  className='flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-all duration-200 dark:border-gray-700'
                >
                  {/* File icon */}
                  <div className='flex-shrink-0'>
                    {getFileTypeIcon(fileState.file.name)}
                  </div>

                  {/* File info */}
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between'>
                      <h4 className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                        {fileState.file.name}
                      </h4>

                      {/* Status indicators */}
                      <div className='flex items-center gap-2'>
                        {fileState.status === 'success' && (
                          <div className='flex h-5 w-5 items-center justify-center rounded-full bg-green-500'>
                            <svg
                              className='h-3 w-3 text-white'
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
                        )}

                        {fileState.status === 'uploading' && (
                          <span className='text-sm font-medium text-blue-600 dark:text-blue-400'>
                            {fileState.progress}%
                          </span>
                        )}

                        {(fileState.status === 'waiting' ||
                          fileState.status === 'error' ||
                          fileState.status === 'uploading') && (
                          <button
                            onClick={() => {
                              if (fileState.status === 'uploading') {
                                cancelFileUpload(fileState.id);
                              } else {
                                removeFileState(fileState.id);
                              }
                            }}
                            className='rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'
                          >
                            <svg
                              className='h-4 w-4'
                              fill='currentColor'
                              viewBox='0 0 20 20'
                            >
                              <path
                                fillRule='evenodd'
                                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                                clipRule='evenodd'
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                      {(fileState.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>

                    {/* Progress bar */}
                    {fileState.status === 'uploading' && (
                      <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700'>
                        <div
                          className='h-2 rounded-full bg-blue-500 transition-all duration-300 ease-out'
                          style={{ width: `${fileState.progress}%` }}
                        />
                      </div>
                    )}

                    {fileState.status === 'error' && fileState.error && (
                      <p className='mt-1 text-sm text-red-600 dark:text-red-400'>
                        {fileState.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {fileStates.length > 0 && (
          <div className='flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700'>
            <span className='text-sm text-gray-500 dark:text-gray-400'>
              {fileStates.length} {fileStates.length === 1 ? 'file' : 'files'}{' '}
              selected
            </span>

            <div className='flex gap-3'>
              <button
                onClick={() => setFileStates([])}
                disabled={isUploading}
                className='rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
              >
                Cancel
              </button>

              <button
                onClick={handleUpload}
                disabled={
                  isUploading ||
                  loading ||
                  fileStates.filter(
                    (s) => s.status === 'waiting' || s.status === 'error',
                  ).length === 0
                }
                className='rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {isUploading ? (
                  <div className='flex items-center gap-2'>
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
                        d='m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      />
                    </svg>
                    Uploading...
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
