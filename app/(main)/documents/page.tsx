'use client';
import {
  DocumentDeleteModal,
  DocumentsHeader,
  DocumentsPagination,
  DocumentsSearch,
  DocumentsTable,
  NoDocuments,
  TableSkeleton,
} from '@/components';
import {
  DeepSearchLayout,
  DocumentPreview,
  MiniDocumentPreview,
} from '@/components/deepSearch';
import { useToast } from '@/components/toast';
import { useLoading } from '@/contexts/LoadingContext';
import { mockSearchResults } from '@/data/deepSearch';
import {
  useAllUserDocuments,
  useDocumentsManagement,
  useKnowledgeBase,
  useSorting,
} from '@/hooks';
import { useDeepSearch } from '@/hooks/useDeepSarch';
import {
  DeepSearchData,
  DocumentSearchResult,
} from '@/interfaces/DeepSearchTypes';
import { DeepSearchRes } from '@/interfaces/DocumentIngestion';
import { Document, Project } from '@/interfaces/Project';
import DocumentService from '@/services/DocumentService';
import { useEffect, useMemo, useState } from 'react';

// Interface that matches what DocumentsTable expects (temporarily for compatibility)
export interface DocumentTableItem {
  name: string;
  size: string;
  type: string;
  date: string;
  rag_status?: string;
  status: string;
  fileUrl: string;
  uploadedBy: string;
  avatar: string;
  project: string[];
  source: string;
  uploadDate: string;
  chunk?: number;
  syncStatus?: string;
  lastUpdated?: string;
  error_message?: string; // Error message for error status tooltips
}

// Adapter function to convert new Document interface to DocumentsTable-compatible format
const adaptDocumentToTableFormat = (doc: Document): DocumentTableItem => ({
  name: (doc.metadata?.originalFileName as string) || doc.name, // Use original filename from metadata if available
  size: doc.file_size
    ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
    : 'Unknown',
  type: doc.file_type,
  date: new Date(doc.created_at).toLocaleDateString(),
  fileUrl: doc.url,
  rag_status: doc.rag_status || 'not_synced',
  status: doc.rag_status || '',
  uploadedBy: 'User', // This field doesn't exist in new interface
  avatar: '/avatars/default.png', // Default avatar
  project: [], // This field doesn't exist in new interface
  source: doc.rag_status || 'not_synced',
  uploadDate: new Date(doc.created_at).toLocaleDateString(),
  chunk: doc.chunk_count,
  syncStatus: doc.rag_status === 'synced' ? 'Synced' : 'Not Synced',
  lastUpdated: new Date(doc.updated_at).toLocaleDateString(),
  error_message: (doc?.error_message as string) || 
    (doc.rag_status === 'error' ? 'An error occurred while processing this document' : undefined),
});

// Adapter function to convert Document to DeepSearchData format for preview components
const adaptDocumentToPreviewFormat = (doc: Document): DeepSearchData => ({
  id: doc.id.toString(),
  name: doc.name,
  content: doc.content || '',
  fileType: doc.file_type,
  fileSize: doc.file_size
    ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
    : 'Unknown',
  uploadDate: new Date(doc.created_at).toLocaleDateString(),
  knowledgeName: 'Documents', // Default value
  fileUrl: doc.url,
});

export default function DocumentsPage() {
  const { setLoading } = useLoading();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [deepSearchLoad, setDeepSearchLoad] = useState(false);
  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>(
    [],
  );
  const [allSearchResults, setAllSearchResults] = useState<
    DocumentSearchResult[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [optionBulkDelete, setOptionBulkDelete] = useState(false);
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const [isNoResults, setIsNoResults] = useState(false);
  const [documentToDelete, setDocumentToDelete] =
    useState<DocumentTableItem | null>(null);

  // Preview modal states
  const [isMiniPreviewOpen, setIsMiniPreviewOpen] = useState(false);
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);
  const [isFullScale, setIsFullScale] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DeepSearchData | null>(
    null,
  );

  // Pagination state
  const [deepCurrentPage, setDeepCurrentPage] = useState(1);

  // Calculate pagination values
  const dtotalResults = allSearchResults.length;
  const dTotalPages = Math.ceil(dtotalResults / 10);
  const dStartIndex = (deepCurrentPage - 1) * 10;
  const dEndIndex = dStartIndex + 10;

  // Document service instance
  const [documentService] = useState(() => new DocumentService());

  // Use sorting hook for enhanced sorting functionality
  const {
    sortBy: sortField,
    sortOrder,
    handleSort: handleSortChange,
    sortDocuments,
  } = useSorting({
    initialSortField: 'date',
    initialSortOrder: 'desc',
  });

  // User documents from hook - auto-load enabled for all user documents
  const {
    totalPages,
    startIndex,
    endIndex,
    currentPage,
    totalItems,
    itemsPerPage,
    loading,
    documents: rawDocuments,
    filteredDocuments: userFilteredDocuments,
    refresh,
    searchTerm,
    setSearchTerm,
    setItemsPerPage,
    handlePageChange,
    getDocumentById,
  } = useAllUserDocuments({
    autoLoad: true,
  });

  const { getKnowledgeBaseIDs, getKnowledgeBaseByIDs } = useKnowledgeBase();

  const { executeSearch } = useDeepSearch();

  // Sort the documents using the SortingService
  const documents = useMemo(() => {
    return sortDocuments(rawDocuments);
  }, [rawDocuments, sortDocuments]);

  // Wrapper: map legacy/UI keys to SortingService SortField
  const handleSortByString = (sortBy: string) => {
    type SortFieldUI =
      | 'name'
      | 'date'
      | 'file_size'
      | 'file_type'
      | 'updated_at';
    const mapped: SortFieldUI = (() => {
      switch (sortBy) {
        case 'size':
          return 'file_size';
        case 'type':
          return 'file_type';
        case 'lastUpdated':
          return 'updated_at';
        case 'name':
        case 'date':
        case 'file_size':
        case 'file_type':
        case 'updated_at':
          return sortBy as SortFieldUI;
        default:
          return 'date';
      }
    })();
    handleSortChange(mapped);
  };

  // Create a wrapper for page change that also resets selected document
  const handlePageChangeWithReset = (page: number) => {
    setSelectedDocument(null); // Reset selected document when page changes
    setSelectedDocuments([]); // Reset selected documents when page changes
    handlePageChange(page);
  };

  const {
    // State
    selectedDocument,
    selectedDocuments,
    activeTab,

    // Handlers
    setSelectedDocument,
    setSelectedDocuments,
    handleClearSelection,
  } = useDocumentsManagement();

  // Create wrapper functions for selection that use correct startIndex (0-based)
  const handleSelectAllWithCorrectIndex = () => {
    const correctStartIndex = startIndex - 1; // Convert from 1-based to 0-based
    const currentPageIndices = documents.map(
      (_: Document, index: number) => correctStartIndex + index,
    );

    if (
      selectedDocuments.length === currentPageIndices.length &&
      currentPageIndices.every((index: number) =>
        selectedDocuments.includes(index),
      )
    ) {
      const filteredSelection = selectedDocuments.filter(
        (index) => !currentPageIndices.includes(index),
      );
      setSelectedDocuments(filteredSelection);
    } else {
      const newSelection = [
        ...new Set([...selectedDocuments, ...currentPageIndices]),
      ];
      setSelectedDocuments(newSelection);
    }
  };

  const handleSelectDocumentWithCorrectIndex = (
    pageIndex: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    event.stopPropagation();
    const correctStartIndex = startIndex - 1; // Convert from 1-based to 0-based
    const actualIndex = correctStartIndex + pageIndex;

    if (selectedDocuments.includes(actualIndex)) {
      setSelectedDocuments(selectedDocuments.filter((i) => i !== actualIndex));
    } else {
      setSelectedDocuments([...selectedDocuments, actualIndex]);
    }
  };

  // Calculate selection states for current page
  const correctStartIndex = startIndex - 1; // Convert from 1-based to 0-based
  const currentPageIndices = documents.map(
    (_, index) => correctStartIndex + index,
  );
  const selectedInCurrentPage = selectedDocuments.filter((index) =>
    currentPageIndices.includes(index),
  );

  const isAllSelectedCorrected =
    currentPageIndices.length > 0 &&
    selectedInCurrentPage.length === currentPageIndices.length;
  const isIndeterminateCorrected =
    selectedInCurrentPage.length > 0 &&
    selectedInCurrentPage.length < currentPageIndices.length;

  // Handle document click for detail view
  const handleDocumentClick = (absoluteIndex: number) => {
    // Convert absolute index to page-relative index for display
    // Note: startIndex from hook is 1-based, absoluteIndex is 0-based
    const pageRelativeIndex = absoluteIndex - (startIndex - 1);
    setSelectedDocument(pageRelativeIndex);
    handleDocumentPreview(pageRelativeIndex);
  };

  const adaptedDocuments = useMemo(() => 
    documents.map((doc: Document) => adaptDocumentToTableFormat(doc)),
    [documents]
  );

  // Delete functions
  const handleSingleDocumentDelete = async (
    documentItem: DocumentTableItem,
  ) => {
    try {
      setLoading(true);
      // Find the original document by matching the original filename from metadata
      const originalDoc = documents.find(
        (doc) => doc.metadata?.originalFileName === documentItem.name,
      );
      if (!originalDoc) {
        throw new Error('Document not found');
      }

      await documentService.deleteDocument(originalDoc.id);

      // Show success notification
      showToast(
        `Document "${documentItem.name}" deleted successfully`,
        'success',
      );

      // Close modal and refresh data
      setIsDeleteModalOpen(false);
      setDocumentToDelete(null);

      // Refresh documents using hook's refresh function
      await refresh();
    } catch (error) {
      console.error('[DocumentsPage] Error deleting document:', error);

      // Show error notification
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to delete document. Please try again.';
      showToast(errorMessage, 'error');

      // Close modal
      setIsDeleteModalOpen(false);
      setDocumentToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNomalSearch = async (search: string) => {
    setSearchQuery(search);
    setSearchTerm(search);
  };

  const handleBulkDocumentDelete = async (selectedIndices: number[]) => {
    try {
      setLoading(true);

      // selectedIndices are absolute indices from the filteredDocuments
      // But we need to map them to the actual documents array
      const documentIds: string[] = [];
      const documentNames: string[] = [];
      selectedIndices.forEach((absoluteIndex) => {
        // Find the document from userFilteredDocuments
        const documentAtIndex = userFilteredDocuments[absoluteIndex];
        if (documentAtIndex?.id) {
          documentIds.push(documentAtIndex.id);
          // Use original filename from metadata for display
          const originalFileName =
            (documentAtIndex.metadata?.originalFileName as string) ||
            documentAtIndex.name;
          documentNames.push(originalFileName);
        }
      });

      if (documentIds.length === 0) {
        throw new Error('No valid documents selected for deletion');
      }

      // Delete each document
      for (const id of documentIds) {
        await documentService.deleteDocument(id);
      }

      // Show success notification
      const documentCount = documentIds.length;
      const successMessage =
        documentCount === 1
          ? `Document "${documentNames[0]}" deleted successfully`
          : `${documentCount} documents deleted successfully`;
      showToast(successMessage, 'success');

      // Clear selection and refresh
      handleClearSelection();

      // Refresh documents using hook's refresh function
      await refresh();
    } catch (error) {
      console.error('[DocumentsPage] Error deleting documents:', error);

      // Show error notification
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to delete documents. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeepSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsDeepSearch(true);
    setDeepSearchLoad(true);
    setIsSearching(true);
    setIsNoResults(false);
    setDeepCurrentPage(1); // Reset to first page on new search

    try {
      console.log('Searching for:', searchQuery);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Use mock data for testing
      const filteredResults = mockSearchResults.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.knowledgeName?.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      setAllSearchResults(filteredResults);
      setIsNoResults(filteredResults.length === 0);

      console.log('Search results:', filteredResults);

      // Original API code (commented out for testing) ห้ามลบ

      const kbId = await getKnowledgeBaseIDs().then((ids) => ids);
      const results: DeepSearchRes[] = await executeSearch({
        query: searchQuery,
        knowledge_ids: kbId,
      });

      if (!results || results.length === 0) {
        setIsNoResults(true);
        return;
      }

      // Collect and sanitize IDs (filter out falsy and duplicates)
      const documentIds = Array.from(
        new Set(
          results
            .map((res: DeepSearchRes) => res.metadata.document_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0),
        ),
      );
      const KBIds = Array.from(
        new Set(
          results
            .map((res: DeepSearchRes) => res.metadata.knowledge_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0),
        ),
      );

      const docRes = await getDocumentById(documentIds);
      const kbRes = await getKnowledgeBaseByIDs(KBIds);

      console.log('Raw search results:', docRes);
      console.log('Knowledge Base results:', kbRes);

      // Map document and knowledge base results to search results
      // Build a lookup from document_id -> first matching chunk content
      const contentByDocId = new Map<string, string>();
      for (const r of results) {
        const docId = r?.metadata?.document_id;
        if (typeof docId === 'string' && docId.length > 0 && !contentByDocId.has(docId)) {
          contentByDocId.set(docId, r.content || '');
        }
      }

      const mappedResults = (docRes || []).map((doc: Document) => {
        const knowledge = kbRes.find(
          (kb: Project) => kb.id === doc.knowledge_base_id,
        );
        const snippet = contentByDocId.get(doc.id) || doc.content || '';
        return {
          id: doc.id,
          title: doc.name,
          content: snippet,
          fileType: doc.file_type,
          fileSize: doc.file_size?.toString() || '0',
          fileUrl: doc.url,
          uploadDate: doc.updated_at,
          knowledgeName: knowledge ? knowledge.name : '',
          document: doc,
        } as unknown as DocumentSearchResult; // conforms to UI needs
      });

      // Feed mapped results into the paginated array state
      setAllSearchResults(mappedResults);
    } catch (error) {
      console.error('Search error:', error);
      setIsNoResults(true);
    } finally {
      setIsSearching(false);
      setDeepSearchLoad(false);
    }
  };

  const handleDeepSearchClear = () => {
    setSearchTerm('');
    setSearchQuery('');
    setSearchResults([]);
    setAllSearchResults([]);
    setIsNoResults(false);
    setIsSearching(false);
    setDeepCurrentPage(1);
    setIsDeepSearch(false);
  };

  const handleResultClick = (result: DocumentSearchResult) => {
    console.log('Document clicked:', result);
    // In real implementation, this would open the document or navigate to document detail
  };

  const handlePageChanges = (page: number) => {
    setDeepCurrentPage(page);
  };

  // Preview handlers
  const handleDocumentPreview = (index: number) => {
    if (documents && documents.length > index) {
      const document = documents[index];
      const previewData = adaptDocumentToPreviewFormat(document);
      setPreviewDocument(previewData);
      setIsMiniPreviewOpen(true);
    }
  };

  const handleExpandToFullScale = () => {
    setIsMiniPreviewOpen(false);
    setIsFullPreviewOpen(true);
    setIsFullScale(true);
  };

  const handleToggleFullScale = () => {
    setIsFullScale(!isFullScale);
  };

  const handleCloseMiniPreview = () => {
    setIsMiniPreviewOpen(false);
    setPreviewDocument(null);
  };

  const handleCloseFullPreview = () => {
    setIsFullPreviewOpen(false);
    setIsFullScale(false);
    setPreviewDocument(null);
  };

  // Reset selected document when search term changes
  useEffect(() => {
    setSelectedDocument(null);
    setSelectedDocuments([]); // Reset selected documents when search changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Update displayed results when page or results per page changes
  useEffect(() => {
    const paginatedResults = allSearchResults.slice(dStartIndex, dEndIndex);
    setSearchResults(paginatedResults);
  }, [allSearchResults, deepCurrentPage, dStartIndex, dEndIndex]);

  return (
    <div>
      {/* Main Container with consistent responsive padding */}
      <div className='p-4 sm:p-6 lg:p-8'>
        {/* Header Section - Responsive layout */}
        <div className='mb-6 sm:mb-8'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <DocumentsHeader />
          </div>
        </div>

        {/* Main Content Layout - Responsive grid */}

        {/* Main Content Area */}
        <div className='flex justify-center space-y-6 sm:max-w-md xl:col-span-3'>
          <DocumentsSearch
            onDeepSearchClick={handleDeepSearch}
            searchTerm={searchTerm}
            onSearchChange={handleNomalSearch}
            isDeepSearch={isDeepSearch}
            handleDeepSearchClear={handleDeepSearchClear}
          />
        </div>

        {!isDeepSearch && (
          <div className='flex gap-4 pt-4'>
            {/* Documents List or Empty State */}
            {totalItems === 0 ? (
              <div className='mt-8 flex w-full justify-center'>
                <NoDocuments activeTab={activeTab} />
              </div>
            ) : loading ? (
              <div className='w-full space-y-6'>
                <TableSkeleton
                  rows={5}
                  columns={6}
                  showHeader={true}
                  showActions={true}
                />
              </div>
            ) : (
              <div className='w-full space-y-6'>
                <DocumentsTable
                  isOpenSync={false}
                  documents={adaptedDocuments}
                  selectedDocuments={selectedDocuments}
                  selectedDocument={selectedDocument}
                  startIndex={startIndex}
                  onDeleteDocument={(dataIndex: number) => {
                    const document = adaptedDocuments[dataIndex];
                    console.log(
                      '[DocumentsPage] Delete document clicked:',
                      document,
                    );

                    setDocumentToDelete(document);
                    setIsDeleteModalOpen(true);
                  }}
                  sortBy={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSortByString}
                  onSelectAll={handleSelectAllWithCorrectIndex}
                  onSelectDocument={handleSelectDocumentWithCorrectIndex}
                  onDocumentClick={handleDocumentClick}
                  isAllSelected={isAllSelectedCorrected}
                  isIndeterminate={isIndeterminateCorrected}
                />

                <DocumentsPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  totalDocuments={totalItems}
                  itemsPerPage={itemsPerPage}
                  loading={loading}
                  onPageChange={handlePageChangeWithReset}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            )}
          </div>
        )}

        {isDeepSearch && (
          <DeepSearchLayout
            className='pt-4'
            searchQuery={searchQuery}
            searchResults={searchResults}
            loading={deepSearchLoad}
            isSearching={isSearching}
            isNoResults={isNoResults}
            onResultClick={handleResultClick}
            currentPage={deepCurrentPage}
            totalPages={dTotalPages}
            resultsPerPage={10}
            totalResults={dtotalResults}
            onPageChange={handlePageChanges}
          />
        )}
      </div>

      <DocumentDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setOptionBulkDelete(false);
          setDocumentToDelete(null);
        }}
        onConfirm={async () => {
          if (documentToDelete) {
            if (optionBulkDelete) {
              await handleBulkDocumentDelete(selectedDocuments);
            } else {
              await handleSingleDocumentDelete(documentToDelete);
            }

            setIsDeleteModalOpen(false);
            setOptionBulkDelete(false);
            setDocumentToDelete(null);
          }
        }}
        documentName={!optionBulkDelete ? documentToDelete?.name : undefined}
        documentCount={optionBulkDelete ? selectedDocuments.length : 1}
        isBulkDelete={optionBulkDelete}
        loading={loading}
      />

      {/* Preview Modals */}
      {previewDocument && (
        <>
          <MiniDocumentPreview
            document={previewDocument}
            isOpen={isMiniPreviewOpen}
            onClose={handleCloseMiniPreview}
            onExpandToFullScale={handleExpandToFullScale}
          />
          <DocumentPreview
            document={previewDocument}
            isOpen={isFullPreviewOpen}
            onClose={handleCloseFullPreview}
            isFullScale={isFullScale}
            onToggleFullScale={handleToggleFullScale}
          />
        </>
      )}
    </div>
  );
}
