'use client';

import React, { useEffect, useRef, useState } from 'react';

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
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle modal visibility and animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Focus modal when opened
      const timer = setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Delay hiding to allow exit animation
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
    } catch (error) {
      console.error('Failed to delete document:', error);
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

  if (!isVisible) return null;

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      className={`fixed left-0 right-0 top-0 z-50 flex h-[calc(100%-1rem)] max-h-full w-full items-center justify-center overflow-y-auto overflow-x-hidden p-4 transition-all duration-200 ease-out md:inset-0 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      role='dialog'
      aria-modal='true'
      aria-labelledby='delete-modal-title'
      aria-describedby='delete-modal-description'
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (e.target === e.currentTarget && !isDeleting) {
          handleClose();
        }
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape' && !isDeleting) {
          e.preventDefault();
          handleClose();
        }
      }}
    >
      <div
        className={`relative max-h-full w-full max-w-md transition-all duration-200 ease-out ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-5'
        }`}
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation();
        }}
      >
        <div className='relative rounded-lg bg-white shadow dark:bg-gray-700'>
          {/* Close button - Flowbite style */}
          {!isDeleting && (
            <button
              type='button'
              className='absolute end-2.5 top-3 ms-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white'
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleClose();
              }}
            >
              <svg
                className='h-3 w-3'
                aria-hidden='true'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 14 14'
              >
                <path
                  stroke='currentColor'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6'
                />
              </svg>
              <span className='sr-only'>Close modal</span>
            </button>
          )}
          
          {/* Modal body - Flowbite Pop-up Modal style */}
          <div className='p-4 text-center md:p-5'>
            {/* Warning icon */}
            <svg
              className='mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200'
              aria-hidden='true'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 20 20'
            >
              <path
                stroke='currentColor'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'
              />
            </svg>
            
            {/* Message */}
            <h3 
              id='delete-modal-title'
              className='mb-5 text-lg font-normal text-gray-500 dark:text-gray-400'
            >
              {content.message}
            </h3>
            
            {/* Action buttons - Flowbite style */}
            <button
              type='button'
              onClick={handleConfirm}
              disabled={isDeleting || loading}
              className='inline-flex items-center rounded-lg bg-red-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isDeleting ? (
                <>
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
                </>
              ) : (
                "Yes, I'm sure"
              )}
            </button>
            
            <button
              type='button'
              onClick={handleClose}
              disabled={isDeleting}
              className='ms-3 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              No, cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDeleteModal;
