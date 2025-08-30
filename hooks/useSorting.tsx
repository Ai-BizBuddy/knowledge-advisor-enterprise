'use client';

/**
 * useSorting Hook
 *
 * Custom hook for handling sorting operations using the SortingService
 * Provides state management and sorting functionality for documents
 */

import type { Document } from '@/interfaces/Project';
import { useCallback, useMemo, useState } from 'react';
// Local sorting types and utilities (refactored from services/SortingService)
export type SortOrder = 'asc' | 'desc';
export type SortField =
  | 'name'
  | 'date'
  | 'file_size'
  | 'file_type'
  | 'updated_at';
export interface SortConfig {
  sortBy: SortField;
  sortOrder: SortOrder;
}
const createSortConfig = (
  sortBy: SortField,
  sortOrder: SortOrder,
): SortConfig => ({ sortBy, sortOrder });
const toggleSortOrder = (current: SortOrder): SortOrder =>
  current === 'asc' ? 'desc' : 'asc';
const getAvailableSortFields = (): { value: SortField; label: string }[] => [
  { value: 'date', label: 'Date' },
  { value: 'name', label: 'Name' },
  { value: 'file_size', label: 'Size' },
  { value: 'file_type', label: 'Type' },
];
const sortDocumentsWithConfig = (
  documents: Document[],
  config: SortConfig,
): Document[] => {
  const { sortBy, sortOrder } = config;
  const toComparable = (doc: Document): string | number => {
    switch (sortBy) {
      case 'name':
        return (doc.name || '').toLowerCase();
      case 'file_size':
        return doc.file_size || 0;
      case 'file_type':
        return (doc.file_type || '').toLowerCase();
      case 'updated_at':
        return new Date(doc.updated_at || doc.created_at).getTime();
      case 'date':
      default:
        return new Date(doc.updated_at || doc.created_at).getTime();
    }
  };
  return [...documents].sort((a, b) => {
    const av = toComparable(a);
    const bv = toComparable(b);
    if (av < bv) return sortOrder === 'asc' ? -1 : 1;
    if (av > bv) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
};

export interface UseSortingProps {
  initialSortField?: SortField;
  initialSortOrder?: SortOrder;
}

export interface UseSortingReturn {
  // State
  sortBy: SortField;
  sortOrder: SortOrder;
  sortConfig: SortConfig;

  // Actions
  setSortBy: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  handleSort: (field: SortField) => void;
  handleSortOrderToggle: () => void;
  resetSort: () => void;

  // Utilities
  sortDocuments: (documents: Document[]) => Document[];
  availableSortFields: { value: SortField; label: string }[];
}

export const useSorting = ({
  initialSortField = 'date',
  initialSortOrder = 'desc',
}: UseSortingProps = {}): UseSortingReturn => {
  // State management
  const [sortBy, setSortByState] = useState<SortField>(initialSortField);
  const [sortOrder, setSortOrderState] = useState<SortOrder>(initialSortOrder);

  // Memoized sort configuration
  const sortConfig = useMemo(
    () => createSortConfig(sortBy, sortOrder),
    [sortBy, sortOrder],
  );

  // Available sort fields
  const availableSortFields = useMemo(() => getAvailableSortFields(), []);

  // Set sort field and reset to ascending order if different field
  const setSortBy = useCallback((field: SortField) => {
    setSortByState(field);
    // Reset to ascending when changing sort field
    setSortOrderState('asc');
  }, []);

  // Set sort order
  const setSortOrder = useCallback((order: SortOrder) => {
    setSortOrderState(order);
  }, []);

  // Handle sort - toggle order if same field, otherwise set new field
  const handleSort = useCallback(
    (field: SortField) => {
      if (sortBy === field) {
        // Same field, toggle order
        setSortOrderState((current) => toggleSortOrder(current));
      } else {
        // Different field, set new field and reset to ascending
        setSortByState(field);
        setSortOrderState('asc');
      }
    },
    [sortBy],
  );

  // Toggle sort order
  const handleSortOrderToggle = useCallback(() => {
    setSortOrderState((current) => toggleSortOrder(current));
  }, []);

  // Reset to initial values
  const resetSort = useCallback(() => {
    setSortByState(initialSortField);
    setSortOrderState(initialSortOrder);
  }, [initialSortField, initialSortOrder]);

  // Sort documents using the service
  const sortDocuments = useCallback(
    (documents: Document[]): Document[] => {
      return sortDocumentsWithConfig(documents, sortConfig);
    },
    [sortConfig],
  );

  return {
    // State
    sortBy,
    sortOrder,
    sortConfig,

    // Actions
    setSortBy,
    setSortOrder,
    handleSort,
    handleSortOrderToggle,
    resetSort,

    // Utilities
    sortDocuments,
    availableSortFields,
  };
};

export default useSorting;
