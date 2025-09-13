'use client';

import { useToast } from '@/components/toast';
import { useAdkChat, useDocuments } from '@/hooks';
import { Project } from '@/interfaces/Project';
import type { ChatSession } from '@/services/DashboardService';
import { Button } from 'flowbite-react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import ChatTab from './ChatTab';
import DocumentList from './DocumentList';
import UserRole from './UserRole';

// Interface that matches what DocumentsTable expects (temporarily for compatibility)
interface DocumentTableItem {
  name: string;
  size: string;
  type: string;
  date: string;
  rag_status?: string;
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
  error_message?: string; // Error message for error status tooltips
}

interface TabsContainerProps {
  knowledgeBase: Project | null;
  knowledgeBaseId: string;
  
  // Centralized tab state
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  tabsList: string[];
  
  // Document state  
  documentState: {
    selectedDocumentIndex: number;
    selectedDocuments: number[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  setDocumentState: React.Dispatch<React.SetStateAction<{
    selectedDocumentIndex: number;
    selectedDocuments: number[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }>>;
  
  // Modal states
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (open: boolean) => void;
  documentToDelete: DocumentTableItem | null;
  setDocumentToDelete: (doc: DocumentTableItem | null) => void;
  isDeleting: boolean;
  setIsDeleting: (deleting: boolean) => void;
  
  // Chat state
  message: string;
  setMessage: (message: string) => void;
  openHistory: boolean;
  setOpenHistory: (open: boolean) => void;
}

export const TabsContainer: React.FC<TabsContainerProps> = ({
  knowledgeBase,
  knowledgeBaseId,
  // Centralized tab state
  currentTab,
  setCurrentTab,
  tabsList,
  // Document state
  documentState,
  setDocumentState,
  // Modal states
  isUploadModalOpen,
  setIsUploadModalOpen,
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  documentToDelete,
  setDocumentToDelete,
  isDeleting,
  setIsDeleting,
  // Chat state
  message,
  setMessage,
  openHistory,
  setOpenHistory,
}) => {
  const { showToast } = useToast();

  // Chat scroll ref
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  const {
    messages,
    isTyping,
    addWelcomeMessage,
    sendMessage,
    createNewChat,
  } = useAdkChat();


  const handleSendMessage = async () => {
    try {
      if (!message.trim()) return;

      const kbSelection = knowledgeBaseId
        ? [
            {
              id: knowledgeBaseId,
              name: knowledgeBase?.name || 'Unknown',
              selected: true,
              documentCount: 0, // This will be updated by the real-time table
            },
          ]
        : [];

      await sendMessage(message, kbSelection);
      setMessage('');

      // Small delay to ensure message is added to state, then scroll
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (err) {
      console.error('[TabsContainer] Chat error:', err);
      showToast('Failed to send message. Please try again.', 'error', 4000);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleLoadChatSession = (session: ChatSession) => {
    // ChatSession doesn't have messages property - need to fetch messages separately
    // For now, create a new chat session since we don't have the messages
    createNewChat();
    setOpenHistory(false);
  };

  return (
    <>
      {/* Tab Navigation */}
      <div className='mb-6 flex justify-between overflow-hidden'>
        <div className='flex items-center gap-4'>
          <span className='text-sm font-medium text-gray-900 dark:text-gray-300'>
            Select Tab:
          </span>
          {tabsList.map((tab) => (
            <div className='me-4 flex items-center' key={tab}>
              <input
                id={`inline-${tab}-radio`}
                type='radio'
                value={tab}
                checked={currentTab === tab}
                onChange={() => setCurrentTab(tab)}
                name='inline-radio-group'
                className='h-4 w-4 border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600'
              />
              <label
                htmlFor={`inline-${tab}-radio`}
                className='ms-2 text-sm font-medium text-gray-900 dark:text-gray-300'
              >
                {tab}
              </label>
            </div>
          ))}
        </div>
        {currentTab === 'Chat Assistant' && (
          <div className='flex flex-col gap-2 sm:flex-row'>
            <Button
              type='button'
              color='light'
              onClick={() => {
                createNewChat();
              }}
              className='flex items-center justify-center gap-2'
            >
              <svg
                className='h-4 w-4'
                fill='none'
                stroke='currentColor'
                strokeWidth={2}
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M12 4v16m8-8H4'
                />
              </svg>
              <span className='text-sm font-medium'>New Chat</span>
            </Button>

            <Button
              type='button'
              color='light'
              onClick={() => setOpenHistory(!openHistory)}
              className='flex items-center justify-center gap-2'
            >
              <svg
                className='h-4 w-4'
                fill='none'
                stroke='currentColor'
                strokeWidth={2}
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <span className='text-sm font-medium'>History</span>
            </Button>
          </div>
        )}
      </div>

     <DocumentTab 
        currentTab={currentTab}
        knowledgeBaseId={knowledgeBaseId}
        documentState={documentState}
        setDocumentState={setDocumentState}
        isUploadModalOpen={isUploadModalOpen}
        setIsUploadModalOpen={setIsUploadModalOpen}
        isDeleteModalOpen={isDeleteModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        documentToDelete={documentToDelete}
        setDocumentToDelete={setDocumentToDelete}
        isDeleting={isDeleting}
        setIsDeleting={setIsDeleting}
      />

      {currentTab === 'Chat Assistant' && (
        <ChatTab
          messages={messages}
          isTyping={isTyping}
          message={message}
          openHistory={openHistory}
          onMessageChange={setMessage}
          onSendMessage={handleSendMessage}
          onCreateNewChat={createNewChat}
          onSetOpenHistory={setOpenHistory}
          onLoadChatSession={handleLoadChatSession}
          chatMessagesRef={chatMessagesRef}
        />
      )}

      {currentTab === 'Users' && knowledgeBase?.visibility === 'custom' && (
        <UserRole 
          knowledgeBaseId={knowledgeBaseId} 
          isActive={currentTab === 'Users'}
        />
      )}
    </>
  );
};

// DocumentTab Props Interface
interface DocumentTabProps {
  currentTab: string;
  knowledgeBaseId: string;
  documentState: {
    selectedDocumentIndex: number;
    selectedDocuments: number[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  setDocumentState: React.Dispatch<React.SetStateAction<{
    selectedDocumentIndex: number;
    selectedDocuments: number[];
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }>>;
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
  isDeleteModalOpen: boolean;
  setIsDeleteModalOpen: (open: boolean) => void;
  documentToDelete: DocumentTableItem | null;
  setDocumentToDelete: (doc: DocumentTableItem | null) => void;
  isDeleting: boolean;
  setIsDeleting: (deleting: boolean) => void;
}

const DocumentTab: React.FC<DocumentTabProps> = ({
  currentTab,
  knowledgeBaseId,
  documentState,
  setDocumentState,
  isUploadModalOpen,
  setIsUploadModalOpen,
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  documentToDelete,
  setDocumentToDelete,
  isDeleting,
  setIsDeleting
}) => {
  const { showToast } = useToast();
  console.log('xx')
  // Use the new useDocuments hook with integrated sync functionality
  const {
    // State
    documents,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    searchTerm,
    totalItems,
    loading,

    // Sync state
    syncingDocuments,
    syncError,

    // Handlers
    handlePageChange,
    setSearchTerm,
    refresh,

    // Sync functions
    syncDocument,
    syncMultipleDocuments,
    clearSyncError,
    isSyncing,
  } = useDocuments({ knowledgeBaseId });

  useEffect(() => {
    console.log({syncError})
    if (syncError) {
      showToast(syncError, 'error', 5000);
      clearSyncError();
    }
  }, [syncError, clearSyncError, showToast]);

  const zeroBasedStartIndex = useMemo(() => startIndex - 1, [startIndex]);

  // Handle single document sync
  const handleDocumentSync = useCallback(
    async (pageIndex: number) => {
      try {
        // Convert page index back to actual array index
        const arrayIndex = pageIndex - zeroBasedStartIndex;
        const document = documents[arrayIndex];
        
        if (!document) {
          console.error('[DocumentTab] Document not found for sync');
          showToast('Error: Document not found for sync', 'error');
          return;
        }

        console.log(`[DocumentTab] Syncing document: ${document.name} (ID: ${document.id})`);
        showToast(`Syncing document: ${document.name}...`, 'info', 3000);
        
        await syncDocument(document.id);
        
        console.log(`[DocumentTab] Successfully synced document: ${document.name}`);
        showToast(`Successfully synced document: ${document.name}`, 'success', 4000);
      } catch (err) {
        console.error('[DocumentTab] Single document sync error:', err);
        // Error is already handled by useDocuments hook and will show via syncError effect
      }
    },
    [documents, syncDocument, showToast, zeroBasedStartIndex],
  );

  // Handle bulk sync for selected documents
  const handleBulkSync = useCallback(
    async () => {
      try {
        if (documentState.selectedDocuments.length === 0) {
          console.warn('[DocumentTab] No documents selected for sync');
          showToast('Please select documents to sync', 'warning', 3000);
          return;
        }

        const selectedDocumentIds = documentState.selectedDocuments
          .map(index => {
            // Convert selected index back to actual array index
            const arrayIndex = index - zeroBasedStartIndex;
            return documents[arrayIndex]?.id;
          })
          .filter(Boolean);

        if (selectedDocumentIds.length === 0) {
          console.error('[DocumentTab] No valid document IDs found for sync');
          showToast('Error: No valid document IDs found for sync', 'error');
          return;
        }

        console.log(`[DocumentTab] Bulk syncing ${selectedDocumentIds.length} documents`);
        showToast(`Starting bulk sync for ${selectedDocumentIds.length} documents...`, 'info', 3000);
        
        await syncMultipleDocuments(selectedDocumentIds);
        
        // Clear selection after successful API calls
        setDocumentState(prev => ({ ...prev, selectedDocuments: [] }));
        
        console.log(`[DocumentTab] Successfully submitted ${selectedDocumentIds.length} documents for sync`);
        showToast(`Successfully submitted ${selectedDocumentIds.length} documents for sync`, 'success', 4000);
      } catch (err) {
        console.error('[DocumentTab] Bulk sync error:', err);
        // Error is already handled by useDocuments hook and will show via syncError effect
      }
    },
    [documentState.selectedDocuments, zeroBasedStartIndex, documents, syncMultipleDocuments, showToast, setDocumentState],
  );

  return (
    <>
      {/* Tab Content */}
      {currentTab === 'Documents' && (
        <DocumentList
          documents={documents}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          searchTerm={searchTerm}
          totalItems={totalItems}
          documentState={documentState}
          syncingDocuments={syncingDocuments}
          isUploadModalOpen={isUploadModalOpen}
          isDeleteModalOpen={isDeleteModalOpen}
          documentToDelete={documentToDelete}
          isDeleting={isDeleting}
          onPageChange={handlePageChange}
          onSearchChange={setSearchTerm}
          onRefresh={refresh}
          onSetDocumentState={setDocumentState}
          onSetUploadModalOpen={setIsUploadModalOpen}
          onSetDeleteModalOpen={setIsDeleteModalOpen}
          onSetDocumentToDelete={setDocumentToDelete}
          onSetDeleting={setIsDeleting}
          onDocumentSync={handleDocumentSync}
          onBulkSync={handleBulkSync}
        />
      )}
    </>
  );
};

export default TabsContainer;
