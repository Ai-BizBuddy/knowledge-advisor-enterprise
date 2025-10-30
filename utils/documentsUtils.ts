import { DocumentStatus, DocumentStatusDisplay } from '@/interfaces/Project';

// Document status utility functions
export const getDocumentStatusDisplay = (status: DocumentStatus): DocumentStatusDisplay => {
  switch (status) {
    case DocumentStatus.UPLOADED:
      return 'Uploaded';
    case DocumentStatus.PROCESSING:
      return 'Processing';
    case DocumentStatus.READY:
      return 'Ready';
    case DocumentStatus.ERROR:
      return 'Error';
    case DocumentStatus.ARCHIVED:
      return 'Archived';
    default:
      return 'Unknown' as DocumentStatusDisplay;
  }
};

export const getDocumentStatusColor = (status: DocumentStatus): string => {
  switch (status) {
    case DocumentStatus.UPLOADED:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case DocumentStatus.PROCESSING:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case DocumentStatus.READY:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case DocumentStatus.ERROR:
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case DocumentStatus.ARCHIVED:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export const isValidDocumentStatus = (status: string): status is DocumentStatus => {
  return Object.values(DocumentStatus).includes(status as DocumentStatus);
};

// Legacy Document interface for backward compatibility
interface LegacyDocument {
  name: string;
  size: string;
  type: string;
  date: string;
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

export interface DocumentDisplayItem {
  id: string;
  name: string;
  type: string;
  size: string;
  project: string;
  uploadedBy: string;
  uploadedAt: string;
  status: string;
  pages: number;
  lastAccessed: string;
  url: string; // Added for download functionality
}

/**
 * Get file icon emoji based on file type
 */
export const getFileIcon = (type: string): string => {
  const normalizedType = type.toLowerCase();

  if (normalizedType === 'unknown' || !normalizedType) return '📁';
  if (normalizedType.includes('pdf')) return '📄';
  if (normalizedType.includes('doc') || normalizedType.includes('word'))
    return '📝';
  if (
    normalizedType.includes('xlsx') ||
    normalizedType.includes('xls') ||
    normalizedType.includes('excel')
  )
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
    return '🖼️';
  return '📄';
};

/**
 * Get file type icon SVG path based on MIME type or extension
 */
export function getFileTypeIcon(type: string, mimeType?: string): string {
  const normalizedType = type.toLowerCase();

  if (normalizedType === 'pdf' || mimeType?.includes('pdf')) {
    return '/assets/icons/pdf.svg';
  }

  if (
    normalizedType === 'docx' ||
    normalizedType === 'doc' ||
    mimeType?.includes('word')
  ) {
    return '/assets/icons/doc.svg';
  }

  if (
    normalizedType === 'xlsx' ||
    normalizedType === 'xls' ||
    mimeType?.includes('sheet')
  ) {
    return '/assets/icons/xlsx.svg';
  }

  if (
    normalizedType === 'markdown' ||
    normalizedType === 'md' ||
    mimeType?.includes('markdown')
  ) {
    return '/assets/icons/markdown.svg';
  }

  return '/assets/icons/file.svg';
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths === 1 ? '' : 's'} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears === 1 ? '' : 's'} ago`;
}

/**
 * Get status color classes for Tailwind
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'processed':
    case 'ready':
    case 'completed':
    case 'synced':
    case 'success':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'processing':
    case 'syncing':
    case 'pending':
    case 'in-progress':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'failed':
    case 'error':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'uploaded':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'archived':
    case 'not synced':
    case 'not_synced':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/**
 * Get tab counts (legacy function for backward compatibility)
 */
export const getTabCounts = (documents: LegacyDocument[]) => {
  const counts = {
    All: documents.length,
    Processed: documents.filter(
      (doc) => doc.source.toLowerCase() === 'processed',
    ).length,
    Processing: documents.filter(
      (doc) => doc.source.toLowerCase() === 'processing',
    ).length,
    Failed: documents.filter((doc) => doc.source.toLowerCase() === 'failed')
      .length,
  };
  return counts;
};

/**
 * Filter documents (legacy function for backward compatibility)
 */
export const filterDocuments = (
  documents: LegacyDocument[],
  searchTerm: string,
  activeTab: string,
): LegacyDocument[] => {
  return documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab =
      activeTab === 'All' ||
      doc.source.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });
};
