import { lookup as mimeLookup } from 'mime-types';

/**
 * Get the MIME type from a file object.
 */
export function getMimeType(file: File): string {
  return mimeLookup(file.name) || file.type || 'application/octet-stream';
}

/**
 * Convert MIME type to a readable label.
 */
export function getFileTypeLabel(mimeType: string): string {
  switch (mimeType) {
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'Word Document';
    case 'application/pdf':
      return 'PDF Document';
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return 'Excel Spreadsheet';
    case 'image/jpeg':
      return 'JPEG Image';
    case 'image/png':
      return 'PNG Image';
    default:
      return 'Unknown File';
  }
}
