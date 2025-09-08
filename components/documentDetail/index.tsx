import { DocumentStatus } from '@/interfaces/Project';
import { getDocumentStatusColor, isValidDocumentStatus } from '@/utils/documentsUtils';

// Document interface for detail component
interface Document {
  name: string;
  size: string;
  type: string;
  date: string;
  fileUrl: string;
  status: string;
  uploadedBy: string;
  avatar: string;
  project: string[];
  source: string;
  uploadDate: string;
  chunk?: number;
  syncStatus?: string;
  lastUpdated?: string;
}

const DocumentDetail: React.FC<Document> = ({
  name,
  size,
  type,
  date,
  fileUrl,
  uploadedBy,
  project,
  source,
  uploadDate,
}) => {
  const getStatusColor = (source: string) => {
    // Check if source is a valid DocumentStatus
    if (isValidDocumentStatus(source)) {
      return getDocumentStatusColor(source as DocumentStatus);
    }
    
    // Fallback for legacy status values
    switch (source.toLowerCase()) {
      case 'processed':
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'uploaded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getFileIcon = (type: string) => {
    const normalizedType = type.toLowerCase();
    if (normalizedType.includes('pdf')) return '📄';
    if (normalizedType.includes('doc') || normalizedType.includes('word'))
      return '📝';
    if (normalizedType.includes('xls') || normalizedType.includes('excel'))
      return '📊';
    if (normalizedType.includes('txt') || normalizedType.includes('text'))
      return '📄';
    if (normalizedType.includes('md') || normalizedType.includes('markdown'))
      return '📄';
    if (normalizedType.includes('ppt') || normalizedType.includes('powerpoint'))
      return '📊';
    if (
      normalizedType.includes('png') ||
      normalizedType.includes('jpg') ||
      normalizedType.includes('jpeg')
    )
      return '�️';
    return '📄';
  };

  return (
    <div className='space-y-4'>
      <div className='text-center'>
        <div className='mb-3 text-6xl'>{getFileIcon(type)}</div>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
          {name}
        </h3>
        <p className='text-sm text-gray-500 dark:text-gray-400'>
          {size} • {type}
        </p>
      </div>

      <div className='space-y-3'>
        <div>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            Status
          </span>
          <div className='mt-1'>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                source,
              )}`}
            >
              {source}
            </span>
          </div>
        </div>

        <div>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            Uploaded By
          </span>
          <div className='mt-1 flex items-center'>
            <div className='flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs font-medium text-gray-700'>
              {uploadedBy
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <span className='ml-2 text-sm text-gray-900 dark:text-white'>
              {uploadedBy}
            </span>
          </div>
        </div>

        <div>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            Upload Date
          </span>
          <p className='mt-1 text-sm text-gray-900 dark:text-white'>
            {uploadDate}
          </p>
        </div>

        <div>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
            Modified
          </span>
          <p className='mt-1 text-sm text-gray-900 dark:text-white'>{date}</p>
        </div>

        {project && project.length > 0 && (
          <div>
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              Projects
            </span>
            <div className='mt-1 flex flex-wrap gap-1'>
              {project.map((proj, index) => (
                <span
                  key={index}
                  className='inline-flex rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                >
                  {proj}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Document Preview Section */}
      <div className='mt-6 space-y-3'>
        <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300'>
          Document Preview
        </h4>
        <div className='rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800/50'>
          {type.toLowerCase().includes('pdf') ? (
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <span className='text-lg'>📄</span>
                <span className='text-sm font-medium text-gray-900 dark:text-white'>
                  PDF Document
                </span>
              </div>
              <p className='text-xs text-gray-600 dark:text-gray-400'>
                Click download to view the full document content.
              </p>
            </div>
          ) : type.toLowerCase().includes('doc') ? (
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <span className='text-lg'>📝</span>
                <span className='text-sm font-medium text-gray-900 dark:text-white'>
                  Word Document
                </span>
              </div>
              <div className='rounded bg-white p-3 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300'>
                <div className='font-semibold'>Document Preview:</div>
                <div className='mt-1 overflow-hidden'>
                  <div
                    className='line-clamp-3'
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    This document contains structured content with headings,
                    paragraphs, and formatting. Download to view the complete
                    document with all formatting preserved.
                  </div>
                </div>
              </div>
            </div>
          ) : type.toLowerCase().includes('xls') ? (
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <span className='text-lg'>📊</span>
                <span className='text-sm font-medium text-gray-900 dark:text-white'>
                  Excel Spreadsheet
                </span>
              </div>
              <div className='rounded bg-white p-3 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300'>
                <div className='font-semibold'>Spreadsheet Preview:</div>
                <div className='mt-1'>
                  Contains data in rows and columns. Download to view and edit
                  the complete spreadsheet.
                </div>
              </div>
            </div>
          ) : (
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <span className='text-lg'>{getFileIcon(type)}</span>
                <span className='text-sm font-medium text-gray-900 dark:text-white'>
                  {type} File
                </span>
              </div>
              <p className='text-xs text-gray-600 dark:text-gray-400'>
                Preview not available for this file type. Download to view
                content.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className=' pt-4 '>
        <button
          onClick={() => {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className='w-[-webkit-fill-available] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
        >
          Download
        </button>
      </div>

      {source.toLowerCase() === 'processed' && (
        <div className='mt-4 rounded-lg bg-green-50 p-4 dark:bg-green-900/20'>
          <h4 className='text-sm font-medium text-green-800 dark:text-green-200'>
            Apollo Core Project
          </h4>
          <p className='mt-1 text-xs text-green-700 dark:text-green-300'>
            This document has been successfully processed and is ready for use
            in knowledge base queries and AI assistance.
          </p>
          <div className='mt-2'>
            <span className='inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900 dark:text-green-200'>
              ✓ Indexed
            </span>
          </div>
        </div>
      )}

      <div className='mt-6 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50'>
        <h4 className='mb-2 text-xs font-medium text-gray-700 dark:text-gray-300'>
          Supported Formats
        </h4>
        <p className='text-xs text-gray-600 dark:text-gray-400'>
          PDF, DOC, DOCX, TXT, MD, XLSX, XLS
        </p>
      </div>
    </div>
  );
};

export default DocumentDetail;
