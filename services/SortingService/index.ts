/**
 * Sorting Service
 *
 * This service handles all sorting operations for documents and other data
 * Provides flexible sorting functionality with support for multiple data types
 */

import type { Document } from '@/interfaces/Project';

export type SortField =
  | 'name'
  | 'date'
  | 'size'
  | 'type'
  | 'uploadedBy'
  | 'status'
  | 'chunk'
  | 'lastUpdated';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export interface SortableDocument {
  // Base document properties for sorting
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  file_type: string;
  file_size?: number | null;
  rag_status?: string | null;
  chunk_count?: number | null;

  // Extended properties for sorting compatibility
  date?: string;
  size?: string;
  uploadedBy?: string;
  status?: string;
  chunk?: number;
  lastUpdated?: string;
}

class SortingService {
  private readonly serviceName = 'Sorting';

  constructor() {
    console.log(`[${this.serviceName}] Service initialized`);
  }

  /**
   * Sort documents based on the provided configuration
   */
  sortDocuments(documents: Document[], sortConfig: SortConfig): Document[] {
    if (!documents || documents.length === 0) {
      return [];
    }

    console.log(
      `[${this.serviceName}] Sorting ${documents.length} documents by ${sortConfig.field} (${sortConfig.order})`,
    );

    return [...documents].sort((a, b) => {
      const result = this.compareDocuments(a, b, sortConfig.field);
      return sortConfig.order === 'asc' ? result : -result;
    });
  }

  /**
   * Compare two documents based on a specific field
   */
  private compareDocuments(a: Document, b: Document, field: SortField): number {
    switch (field) {
      case 'name':
        return this.compareStrings(a.name, b.name);

      case 'date':
        return this.compareDates(a.created_at, b.created_at);

      case 'size':
        return this.compareSizes(a.file_size, b.file_size);

      case 'type':
        return this.compareStrings(a.file_type, b.file_type);

      case 'uploadedBy':
        // Since Document interface doesn't have uploadedBy, use a default comparison
        return 0;

      case 'status':
        return this.compareStrings(a.rag_status || '', b.rag_status || '');

      case 'chunk':
        return this.compareNumbers(a.chunk_count || 0, b.chunk_count || 0);

      case 'lastUpdated':
        return this.compareDates(a.updated_at, b.updated_at);

      default:
        console.warn(`[${this.serviceName}] Unknown sort field: ${field}`);
        return 0;
    }
  }

  /**
   * Compare two strings (case-insensitive)
   */
  private compareStrings(a: string, b: string): number {
    const aLower = (a || '').toLowerCase();
    const bLower = (b || '').toLowerCase();

    if (aLower < bLower) return -1;
    if (aLower > bLower) return 1;
    return 0;
  }

  /**
   * Compare two dates
   */
  private compareDates(a: string, b: string): number {
    const dateA = new Date(a).getTime();
    const dateB = new Date(b).getTime();

    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;

    return dateA - dateB;
  }

  /**
   * Compare two file sizes (in bytes)
   */
  private compareSizes(
    a: number | null | undefined,
    b: number | null | undefined,
  ): number {
    const sizeA = a || 0;
    const sizeB = b || 0;
    return sizeA - sizeB;
  }

  /**
   * Compare two numbers
   */
  private compareNumbers(a: number, b: number): number {
    return a - b;
  }

  /**
   * Get available sort fields for documents
   */
  getAvailableSortFields(): { value: SortField; label: string }[] {
    return [
      { value: 'date', label: 'Date' },
      { value: 'name', label: 'Name' },
      { value: 'size', label: 'Size' },
      { value: 'type', label: 'Type' },
      { value: 'status', label: 'Status' },
      { value: 'chunk', label: 'Chunk Count' },
      { value: 'lastUpdated', label: 'Last Updated' },
    ];
  }

  /**
   * Create a sort configuration
   */
  createSortConfig(field: SortField, order: SortOrder = 'asc'): SortConfig {
    return { field, order };
  }

  /**
   * Toggle sort order (asc <-> desc)
   */
  toggleSortOrder(currentOrder: SortOrder): SortOrder {
    return currentOrder === 'asc' ? 'desc' : 'asc';
  }

  /**
   * Sort multiple arrays based on a primary array's sort order
   * Useful for maintaining related data consistency
   */
  sortRelatedArrays<T>(
    primaryArray: T[],
    relatedArrays: T[][],
    compareFunction: (a: T, b: T) => number,
    order: SortOrder = 'asc',
  ): { primary: T[]; related: T[][] } {
    // Create indices for tracking original positions
    const indexedPrimary = primaryArray.map((item, index) => ({ item, index }));

    // Sort the indexed array
    indexedPrimary.sort((a, b) => {
      const result = compareFunction(a.item, b.item);
      return order === 'asc' ? result : -result;
    });

    // Extract sorted primary array and new order indices
    const sortedPrimary = indexedPrimary.map(({ item }) => item);
    const newOrder = indexedPrimary.map(({ index }) => index);

    // Sort related arrays based on the new order
    const sortedRelated = relatedArrays.map((arr) =>
      newOrder.map((originalIndex) => arr[originalIndex]),
    );

    return {
      primary: sortedPrimary,
      related: sortedRelated,
    };
  }

  /**
   * Validate sort configuration
   */
  validateSortConfig(config: SortConfig): boolean {
    const validFields = this.getAvailableSortFields().map((f) => f.value);
    const validOrders: SortOrder[] = ['asc', 'desc'];

    return (
      validFields.includes(config.field) && validOrders.includes(config.order)
    );
  }
}

export default SortingService;
