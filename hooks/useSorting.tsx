'use client';

/**
 * useSorting Hook
 *
 * Custom hook for handling sorting operations using the SortingService
 * Provides state management and sorting functionality for documents
 */

import type { Document } from '@/interfaces/Project';
import { sortingService } from '@/services';
import type {
  SortConfig,
  SortField,
  SortOrder,
} from '@/services/SortingService';
import { useCallback, useMemo, useState } from 'react';

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
    () => sortingService.createSortConfig(sortBy, sortOrder),
    [sortBy, sortOrder],
  );

  // Available sort fields
  const availableSortFields = useMemo(
    () => sortingService.getAvailableSortFields(),
    [],
  );

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
        setSortOrderState((current) => sortingService.toggleSortOrder(current));
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
    setSortOrderState((current) => sortingService.toggleSortOrder(current));
  }, []);

  // Reset to initial values
  const resetSort = useCallback(() => {
    setSortByState(initialSortField);
    setSortOrderState(initialSortOrder);
  }, [initialSortField, initialSortOrder]);

  // Sort documents using the service
  const sortDocuments = useCallback(
    (documents: Document[]): Document[] => {
      return sortingService.sortDocuments(documents, sortConfig);
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
