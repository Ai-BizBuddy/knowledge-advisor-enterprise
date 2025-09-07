'use client';
import { DocumentSearchResult } from '@/interfaces/DeepSearchTypes';
import { highlightText } from '@/utils/textHighlight';

interface DocumentCardProps extends DocumentSearchResult {
  onClick?: (document: DocumentSearchResult) => void;
  onPreview?: (document: DocumentSearchResult) => void;
  className?: string;
  searchQuery?: string;
}

export const DocumentCard = ({
  onClick,
  onPreview,
  className = '',
  searchQuery = '',
  ...result
}: DocumentCardProps) => {
  const {
    title,
    content,
    fileType,
    fileSize,
    uploadDate,
    knowledgeName,
    fileUrl,
  } = result;

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return (
          <svg
            className='h-6 w-6 text-red-500'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'docx':
      case 'doc':
        return (
          <svg
            className='h-6 w-6 text-blue-500'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'pptx':
      case 'ppt':
        return (
          <svg
            className='h-6 w-6 text-orange-500'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'txt':
        return (
          <svg
            className='h-6 w-6 text-gray-600'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'md':
        return (
          <svg
            className='h-6 w-6 text-purple-500'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
              clipRule='evenodd'
            />
          </svg>
        );
      case 'xlsx':
      case 'xls':
        return (
          <svg
            className='h-6 w-6 text-green-500'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
              clipRule='evenodd'
            />
          </svg>
        );
      default:
        return (
          <svg
            className='h-6 w-6 text-gray-500'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
              clipRule='evenodd'
            />
          </svg>
        );
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(result);
    }
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (onPreview && fileUrl) {
      onPreview(result);
    }
  };

  return (
    <div
      className={`card cursor-pointer transition-shadow hover:shadow-md ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        handleClick();
        handlePreview(e);
      }}
    >
      <div className='flex items-start gap-4 p-4'>
        {/* File Icon */}
        <div className='mt-1 flex-shrink-0'>{getFileIcon(fileType)}</div>

        {/* Content */}
        <div className='min-w-0 flex-1'>
          {/* Header */}
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0 flex-1'>
              <h3 className='line-clamp-1 text-lg font-medium text-gray-900 dark:text-gray-100'>
                {highlightText(title, searchQuery)}
              </h3>
              <div className='mt-1 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400'>
                <span className='flex items-center gap-1'>
                  <svg
                    className='h-4 w-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  {fileType}
                </span>
                <span>•</span>
                <span>{fileSize}</span>
                <span>•</span>
                <span>{new Date(uploadDate).toLocaleDateString()}</span>
                {knowledgeName && (
                  <>
                    <span>•</span>
                    <span className='font-medium text-blue-600 dark:text-blue-400'>
                      {knowledgeName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Content Preview */}
          <p className='mt-2 line-clamp-2 text-gray-600 dark:text-gray-400'>
            {highlightText(content, searchQuery)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;
