'use client';

import { Button } from 'flowbite-react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';

interface DocumentDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  documentName?: string;
  documentCount?: number;
  isBulkDelete?: boolean;
  loading?: boolean;
}

export const DocumentDeleteModal: React.FC<DocumentDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  documentName,
  documentCount = 1,
  isBulkDelete = false,
  loading = false,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
    } catch (error) {
          } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  // Determine modal content based on delete type
  const getModalContent = () => {
    if (isBulkDelete) {
      return {
        title: 'Delete Multiple Documents',
        message: `Are you sure you want to delete ${documentCount} selected document${documentCount > 1 ? 's' : ''}?`,
        warning: 'This action cannot be undone. All selected documents will be permanently removed.',
      };
    } else {
      return {
        title: 'Delete Document',
        message: documentName 
          ? `Are you sure you want to delete "${documentName}"?`
          : 'Are you sure you want to delete this document?',
        warning: 'This action cannot be undone. The document will be permanently removed.',
      };
    }
  };

  const content = getModalContent();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.2 }}
          className='relative w-full max-w-md p-4'
        >
          <div className='relative rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800'>
            {/* Close button */}
            {!isDeleting && (
              <button
                type='button'
                className='absolute top-3 right-3 ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white'
                onClick={handleClose}
              >
                <svg
                  className='h-5 w-5'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    fillRule='evenodd'
                    d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                    clipRule='evenodd'
                  />
                </svg>
                <span className='sr-only'>Close modal</span>
              </button>
            )}

            {/* Icon */}
            <div className='text-center'>
              <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
                <svg
                  className='h-6 w-6 text-red-600 dark:text-red-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
              </div>

              {/* Title */}
              <h3 className='mb-2 text-lg font-semibold text-gray-900 dark:text-white'>
                {content.title}
              </h3>

              {/* Message */}
              <p className='mb-2 text-gray-500 dark:text-gray-400'>
                {content.message}
              </p>

              {/* Warning */}
              <p className='mb-6 text-sm text-gray-400 dark:text-gray-500'>
                {content.warning}
              </p>

              {/* Action buttons */}
              <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:gap-4'>
                <Button
                  color='gray'
                  onClick={handleClose}
                  disabled={isDeleting}
                  className='w-full sm:w-auto'
                >
                  Cancel
                </Button>
                <Button
                  color='failure'
                  onClick={handleConfirm}
                  disabled={isDeleting || loading}
                  className='w-full sm:w-auto'
                >
                  {isDeleting ? (
                    <div className='flex items-center justify-center'>
                      <svg
                        className='mr-2 h-4 w-4 animate-spin'
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
                      Deleting...
                    </div>
                  ) : (
                    'Yes, delete'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DocumentDeleteModal;
