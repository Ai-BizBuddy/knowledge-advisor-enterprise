'use client';
import { useDocuments } from '@/hooks';
import { useParams } from 'next/navigation';
import React, { useState, useRef, JSX, useEffect } from 'react';

interface UploadDocumentProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadDocument({
  isOpen,
  onClose,
}: UploadDocumentProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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

  // svg icons for file types .pdf, .doc, .docx, .txt, .md, .xlsx, .xls
  const iconsFileType: Record<
    'pdf' | 'doc' | 'docx' | 'txt' | 'md' | 'xlsx' | 'xls',
    JSX.Element
  > = {
    pdf: (
      <svg
        className='h-6 w-6 text-red-500'
        aria-hidden='true'
        xmlns='http://www.w3.org/2000/svg'
        width='24'
        height='24'
        fill='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          fillRule='evenodd'
          d='M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7Z'
          clipRule='evenodd'
        />
      </svg>
    ),
    doc: (
      <svg
        className='h-6 w-6 text-blue-500'
        aria-hidden='true'
        xmlns='http://www.w3.org/2000/svg'
        width='24'
        height='24'
        fill='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          fillRule='evenodd'
          d='M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7Z'
          clipRule='evenodd'
        />
      </svg>
    ),
    docx: (
      <svg
        className='h-6 w-6 text-blue-500'
        aria-hidden='true'
        xmlns='http://www.w3.org/2000/svg'
        width='24'
        height='24'
        fill='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          fillRule='evenodd'
          d='M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7Z'
          clipRule='evenodd'
        />
      </svg>
    ),
    txt: (
      <svg
        className='h-6 w-6 text-gray-500'
        aria-hidden='true'
        xmlns='http://www.w3.org/2000/svg'
        width='24'
        height='24'
        fill='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          fillRule='evenodd'
          d='M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7Z'
          clipRule='evenodd'
        />
      </svg>
    ),
    md: (
      <svg
        className='h-6 w-6 text-green-500'
        aria-hidden='true'
        xmlns='http://www.w3.org/2000/svg'
        width='24'
        height='24'
        fill='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          fillRule='evenodd'
          d='M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7Z'
          clipRule='evenodd'
        />
      </svg>
    ),
    xlsx: (
      <svg
        className='h-6 w-6 text-green-400'
        aria-hidden='true'
        xmlns='http://www.w3.org/2000/svg'
        width='24'
        height='24'
        fill='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          fillRule='evenodd'
          d='M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7Z'
          clipRule='evenodd'
        />
      </svg>
    ),
    xls: (
      <svg
        className='h-6 w-6 text-green-400'
        aria-hidden='true'
        xmlns='http://www.w3.org/2000/svg'
        width='24'
        height='24'
        fill='currentColor'
        viewBox='0 0 24 24'
      >
        <path
          fillRule='evenodd'
          d='M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7Z'
          clipRule='evenodd'
        />
      </svg>
    ),
    // Add more icons as needed
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || isUploading || loading) return;
    const arr = Array.from(files);
    if (arr.length + selectedFiles.length > maxFiles) {
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
    setSelectedFiles((prev) => [...prev, ...arr]);
    setError('');
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
    setTimeout(() => {
      setError('');
    }, 3000);
  }, [error]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm sm:p-6'>
      <div className='max-h-[90vh] w-full max-w-4xl rounded-xl border border-gray-200 bg-white text-gray-900 shadow-2xl shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white'>
        <div className='flex items-start justify-between border-b border-gray-200 dark:border-gray-700'>
          <div className='p-4 sm:p-6'>
            <h2 className='text-base font-bold text-gray-900 sm:text-lg dark:text-white'>
              {' '}
              Upload Document{' '}
            </h2>
            <p className='text-xs text-gray-500 sm:text-sm dark:text-gray-400'>
              Add documents to Document Library
            </p>
          </div>
          <div className='p-4 sm:p-6'>
            <button
              className='cursor-pointer text-lg text-gray-400 hover:text-gray-600 sm:text-xl dark:hover:text-white'
              disabled={isUploading || loading}
              onClick={() => {
                if (!isUploading && !loading) {
                  onClose();
                  setSelectedFiles([]);
                  setError('');
                }
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Upload Document File area */}
        <div className='max-h-[70vh] overflow-y-auto p-4 sm:p-6'>
          {error && (
            <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 sm:p-4 sm:text-sm dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'>
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
          {selectedFiles.length > 0 ? (
            <>
              <div className='mt-4 flex flex-col gap-2 text-left'>
                <p className='mb-2 text-sm font-semibold sm:text-base'>
                  Selected files: ({selectedFiles.length})
                </p>
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className='flex items-center justify-between rounded-xl border border-gray-200 p-3 sm:p-4 dark:border-gray-700'
                  >
                    <div className='flex min-w-0 flex-1 items-center gap-2 sm:gap-4'>
                      {/* icon file type */}
                      <div className='flex-shrink-0'>
                        {(() => {
                          const ext = file.name
                            .split('.')
                            .pop()
                            ?.toLowerCase() as
                            | keyof typeof iconsFileType
                            | undefined;
                          return ext && iconsFileType[ext]
                            ? iconsFileType[ext]
                            : null;
                        })()}
                      </div>

                      <div className='min-w-0 flex-1'>
                        <p className='truncate text-xs font-medium text-gray-900 sm:text-sm dark:text-white'>
                          {file.name}
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                          {`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                      </div>
                    </div>

                    <button
                      className='ml-2 flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-500/10 hover:text-red-400'
                      onClick={() =>
                        setSelectedFiles((prev) =>
                          prev.filter((_, i) => i !== idx),
                        )
                      }
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
                          d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                        ></path>
                      </svg>
                    </button>
                  </div>
                  // <li key={idx}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                ))}
                {/* check max file and max file size */}
                {selectedFiles.length < maxFiles && (
                  <div
                    className={`relative cursor-pointer rounded-2xl border-2 border-dashed border-gray-600 p-4 text-center transition-all duration-300 hover:border-gray-500 sm:p-8 ${
                      isUploading || loading
                        ? 'pointer-events-none opacity-50'
                        : ''
                    }`}
                    onDrop={isUploading || loading ? undefined : onDrop}
                    onDragOver={
                      isUploading || loading
                        ? undefined
                        : (e) => e.preventDefault()
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
                    <span className='absolute inset-0 flex items-center justify-center text-sm font-medium text-blue-400 hover:text-blue-300 sm:text-base'>
                      {isUploading || loading
                        ? 'Uploading...'
                        : '+ Add more files'}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed border-gray-600 p-4 text-center transition-all duration-300 hover:border-gray-500 hover:bg-blue-50 sm:p-8 dark:hover:bg-gray-800 ${
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
              <div className='space-y-2 sm:space-y-4'>
                <div className='mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 sm:mb-4 sm:h-16 sm:w-16'>
                  <svg
                    className='h-6 w-6 text-blue-400 sm:h-8 sm:w-8'
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
                <h3 className='mb-1 text-lg font-bold text-gray-900 sm:mb-2 sm:text-xl dark:text-white'>
                  Upload Documents
                </h3>
                <p className='text-xs text-gray-500 sm:text-sm dark:text-gray-400'>
                  Drag and drop files here, or click to browse
                </p>
                <p className='text-xs text-gray-500 sm:text-sm dark:text-gray-400'>
                  Supported formats: PDF, DOC, DOCX, TXT, MD, XLSX, XLS
                </p>
                <p className='text-xs text-gray-500 sm:text-sm dark:text-gray-400'>
                  Max 10 files, 10MB each
                </p>
              </div>
            </div>
          )}
        </div>
        {selectedFiles.length > 0 && (
          <div className='flex flex-col items-start justify-between gap-4 border-t border-gray-200 p-4 sm:flex-row sm:items-center sm:gap-0 sm:p-6 dark:border-gray-700'>
            <span className='text-xs text-gray-500 sm:text-sm dark:text-gray-400'>
              {selectedFiles.length} of {maxFiles} files selected
            </span>
            <button
              className='w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:text-base'
              disabled={isUploading || loading}
              onClick={async () => {
                try {
                  setIsUploading(true);
                  setError('');

                  await createDocumentsFromFiles({
                    knowledge_base_id: id,
                    files: selectedFiles,
                    metadata: {
                      uploadSource: 'upload_modal',
                      uploadedAt: new Date().toISOString(),
                      totalFiles: selectedFiles.length,
                    },
                  });

                  // Reset and close on success
                  setSelectedFiles([]);
                  onClose();
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : 'Failed to upload documents. Please try again.',
                  );
                } finally {
                  setIsUploading(false);
                }
              }}
            >
              {isUploading || loading ? (
                <div className='flex items-center justify-center gap-2'>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent'></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'file' : 'files'}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
