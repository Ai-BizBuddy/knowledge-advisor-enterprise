import type { Document } from '@/interfaces/Project';

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
    url: doc.url,
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
 * Sort legacy documents (backward compatibility)
 */
export const sortDocuments = (
  docs: LegacyDocument[],
  sortBy: string,
  sortOrder: 'asc' | 'desc',
): LegacyDocument[] => {
  return [...docs].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'Name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'Date':
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
        break;
      case 'Size':
        // Convert size to bytes for comparison
        aValue =
          parseFloat(a.size) *
          (a.size.includes('MB')
            ? 1024 * 1024
            : a.size.includes('KB')
              ? 1024
              : 1);
        bValue =
          parseFloat(b.size) *
          (b.size.includes('MB')
            ? 1024 * 1024
            : b.size.includes('KB')
              ? 1024
              : 1);
        break;
      case 'Type':
        aValue = a.type.toLowerCase();
        bValue = b.type.toLowerCase();
        break;
      case 'Uploaded By':
        aValue = a.uploadedBy.toLowerCase();
        bValue = b.uploadedBy.toLowerCase();
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

/**
 * Sort modern Document objects
 */
export const sortModernDocuments = (
  docs: Document[],
  sortBy: keyof Document,
  sortOrder: 'asc' | 'desc',
): Document[] => {
  return [...docs].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'file_size':
        aValue = a.file_size || 0;
        bValue = b.file_size || 0;
        break;
      case 'file_type':
        aValue = (a.file_type || '').toLowerCase();
        bValue = (b.file_type || '').toLowerCase();
        break;
      case 'updated_at':
        aValue = new Date(a.updated_at || a.created_at).getTime();
        bValue = new Date(b.updated_at || b.created_at).getTime();
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (aValue < bValue) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

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
 * Get tab counts for modern Document objects
 */
export const getModernTabCounts = (documents: Document[]) => {
  const counts = {
    All: documents.length,
    Processed: documents.filter((doc) => doc.rag_status === 'synced').length,
    Processing: documents.filter((doc) => doc.rag_status === 'syncing').length,
    Failed: documents.filter((doc) => doc.rag_status === 'error').length,
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

/**
 * Filter modern Document objects
 */
export const filterModernDocuments = (
  documents: Document[],
  searchTerm: string,
  activeTab: string,
): Document[] => {
  return documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.metadata?.uploaded_by as string)
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    let matchesTab = true;
    if (activeTab !== 'All') {
      switch (activeTab.toLowerCase()) {
        case 'processed':
          matchesTab = doc.rag_status === 'synced';
          break;
        case 'processing':
          matchesTab = doc.rag_status === 'syncing';
          break;
        case 'failed':
          matchesTab = doc.rag_status === 'error';
          break;
        default:
          matchesTab = true;
      }
    }

    return matchesSearch && matchesTab;
  });
};
