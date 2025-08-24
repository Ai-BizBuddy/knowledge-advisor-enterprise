import type { Document } from '@/interfaces/Project';

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
 * Convert Supabase Document to display format
 */
export function transformDocumentForDisplay(
  doc: Document,
): DocumentDisplayItem {
  return {
    id: doc.id,
    name: doc.name,
    type: doc.file_type || 'Unknown',
    size: formatFileSize(doc.file_size || 0),
    project:
      typeof doc.metadata?.project_name === 'string'
        ? doc.metadata.project_name
        : 'Unknown Project',
    uploadedBy:
      typeof doc.metadata?.uploaded_by === 'string'
        ? doc.metadata.uploaded_by
        : 'Unknown User',
    uploadedAt: doc.created_at,
    status: doc.status || 'unknown',
    pages:
      typeof doc.metadata?.pages === 'number'
        ? doc.metadata.pages
        : doc.chunk_count || 0,
    lastAccessed: formatRelativeTime(doc.updated_at || doc.created_at),
    url: doc.url, // Added for download functionality
  };
}

/**
 * Get status color classes for Tailwind
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'processed':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'processing':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'failed':
    case 'error':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/**
 * Get file type icon based on MIME type or extension
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
