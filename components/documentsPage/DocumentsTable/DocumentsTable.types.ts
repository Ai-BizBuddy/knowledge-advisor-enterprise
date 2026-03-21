import React from 'react';

export interface DocumentTableItem {
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
  disableSync?: boolean;
  error_message?: string;
}

export interface DocumentsTableProps {
  documents: DocumentTableItem[];
  selectedDocuments: number[];
  selectedDocument: number | null;
  isOpenSync?: boolean;
  startIndex: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
  onSelectAll?: () => void;
  onDeleteDocument?: (index: number) => void;
  onEditDocument?: (index: number) => void;
  onOcrDocument?: (index: number) => void;
  onPageViewDocument?: (index: number) => void;
  onSelectDocument?: (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  onDocumentClick?: (index: number) => void;
  onSyncDocument?: (index: number, pipeline?: string, mode?: string) => void;
  isAllSelected?: boolean;
  isIndeterminate?: boolean;
  syncingDocuments?: Set<number>;
}

export interface SyncControlProps {
  syncStatus?: string;
  isLoading?: boolean;
  onSync?: (pipeline?: string, mode?: string) => void;
  documentStatus?: string;
  disableSync?: boolean;
}
