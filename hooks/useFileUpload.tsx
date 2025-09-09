'use client';

import React, { useCallback, useRef, useState } from 'react';

export interface FileUploadState {
  file: File;
  status: 'waiting' | 'uploading' | 'success' | 'error' | 'cancelled';
  progress: number;
  error?: string;
  id: string;
}

export interface UseFileUploadOptions {
  maxFiles?: number;
  maxSize?: number; // in bytes
  supportedTypes?: string[];
  supportedExtensions?: string[];
}

export interface UseFileUploadReturn {
  fileStates: FileUploadState[];
  error: string | null;
  isUploading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  handleFiles: (files: FileList | null) => void;
  removeFile: (id: string) => void;
  cancelUpload: (id: string) => void;
  clearAll: () => void;
  updateFileState: (id: string, updates: Partial<FileUploadState>) => void;
  getFileIcon: (fileName: string) => React.ReactElement;
  startUpload: (uploadFn: (files: File[]) => Promise<void>) => Promise<void>;
}

const DEFAULT_SUPPORTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const DEFAULT_SUPPORTED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'md', 'xlsx', 'xls'];

/**
 * Unified file upload hook with progress tracking and error handling
 * Consolidates file upload logic used across multiple components
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    maxFiles = 10,
    maxSize = 10 * 1024 * 1024, // 10MB
    supportedTypes = DEFAULT_SUPPORTED_TYPES,
    supportedExtensions = DEFAULT_SUPPORTED_EXTENSIONS,
  } = options;

  const [fileStates, setFileStates] = useState<FileUploadState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const createFileState = useCallback((file: File): FileUploadState => ({
    file,
    status: 'waiting',
    progress: 0,
    id: `${file.name}-${Date.now()}-${Math.random()}`,
  }), []);

  const updateFileState = useCallback((id: string, updates: Partial<FileUploadState>) => {
    setFileStates((prev) =>
      prev.map((state) => (state.id === id ? { ...state, ...updates } : state))
    );
  }, []);

  const removeFile = useCallback((id: string) => {
    setFileStates((prev) => prev.filter((state) => state.id !== id));
  }, []);

  const cancelUpload = useCallback((id: string) => {
    updateFileState(id, { status: 'cancelled' });
  }, [updateFileState]);

  const clearAll = useCallback(() => {
    setFileStates([]);
    setError(null);
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = supportedTypes.includes(file.type) || 
      (fileExtension && supportedExtensions.includes(fileExtension));
    
    if (!isValidType) {
      return `Unsupported file type: ${file.name}`;
    }

    // Check file size
    if (file.size > maxSize) {
      return `File ${file.name} exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`;
    }

    return null;
  }, [supportedTypes, supportedExtensions, maxSize]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || isUploading) return;
    
    const fileArray = Array.from(files);

    // Check total file count
    if (fileArray.length + fileStates.length > maxFiles) {
      setError(`You can upload up to ${maxFiles} files`);
      return;
    }

    // Validate each file
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Add files to state
    const newFileStates = fileArray.map(createFileState);
    setFileStates((prev) => [...prev, ...newFileStates]);
    setError(null);
  }, [fileStates.length, maxFiles, isUploading, validateFile, createFileState]);

  const startUpload = useCallback(async (uploadFn: (files: File[]) => Promise<void>) => {
    const filesToUpload = fileStates.filter(
      (state) => state.status === 'waiting' || state.status === 'error'
    );

    if (filesToUpload.length === 0) return;

    try {
      setIsUploading(true);
      setError(null);

      // Set all files to uploading status
      filesToUpload.forEach((state) => {
        updateFileState(state.id, { status: 'uploading', progress: 0 });
      });

      // Execute upload function
      const files = filesToUpload.map((state) => state.file);
      await uploadFn(files);

      // Mark all as successful
      filesToUpload.forEach((state) => {
        updateFileState(state.id, { status: 'success', progress: 100 });
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      
      // Mark all uploading files as error
      filesToUpload.forEach((state) => {
        updateFileState(state.id, { status: 'error', error: errorMessage });
      });
    } finally {
      setIsUploading(false);
    }
  }, [fileStates, updateFileState]);

  const getFileIcon = useCallback((fileName: string): React.ReactElement => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    const iconConfig = {
      pdf: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400' },
      doc: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
      docx: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
      txt: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' },
      xlsx: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
      xls: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400' },
      zip: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400' },
      jpg: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
      jpeg: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
      png: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
      gif: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
    };

    const config = iconConfig[ext as keyof typeof iconConfig] || iconConfig.txt;

    return (
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bg}`}>
        <svg className={`h-6 w-6 ${config.text}`} fill='currentColor' viewBox='0 0 24 24'>
          <path d='M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z' />
        </svg>
      </div>
    );
  }, []);

  return {
    fileStates,
    error,
    isUploading,
    inputRef: inputRef as React.RefObject<HTMLInputElement>,
    handleFiles,
    removeFile,
    cancelUpload,
    clearAll,
    updateFileState,
    getFileIcon,
    startUpload,
  };
}
