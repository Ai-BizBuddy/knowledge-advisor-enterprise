'use client';

import { KnowledgeBaseCard, PageHeader } from '@/components';
import CreateKnowledgeBaseModal from '@/components/createKnowledgeBaseModal';
import DeleteConfirmModal from '@/components/deleteConfirmModal';
import EditKnowledgeBaseModal from '@/components/editKnowledgeBaseModal';
import KnowledgeBasePagination from '@/components/knowledgeBasePagination';
import KnowledgeBaseSearch from '@/components/knowledgeBaseSearch';
import { useToast } from '@/components/toast';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { Project, UpdateProjectInput } from '@/interfaces/Project';
import { Button } from 'flowbite-react';
import { useEffect, useState } from 'react';
import Loading from './loading';

export default function KnowledgeBase() {
  const [openModal, setOpenModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [knowledgeBaseToDelete, setKnowledgeBaseToDelete] = useState<
    string | null
  >(null);

  const { showToast } = useToast();

  const {
    // State
    projects,
    loading,
    searchTerm,

    // Pagination
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,

    initialLoad,
    handlePageChange,
    handleKnowledgeBaseClick,
    handleKnowledgeBaseDelete,
    searchKnowledgeBases,
    createKnowledgeBase,
    updateKnowledgeBase,
  } = useKnowledgeBase();

  const formatUpdatedTime = (updatedAt: string) => {
    const date = new Date(updatedAt);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleKnowledgeBaseSearch = async (query: string) => {
    try {
      await searchKnowledgeBases(query);
    } catch (error) {
      console.error('Search failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Search failed. Please try again.';
      showToast(errorMessage, 'error');
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (id: string) => {
    setKnowledgeBaseToDelete(id);
    setDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (knowledgeBaseToDelete) {
      setDeleteModal(false);
      try {
        await handleKnowledgeBaseDelete(knowledgeBaseToDelete);
        // Reload the data after successful deletion
        await initialLoad();
        showToast('Knowledge base deleted successfully', 'success');
        setKnowledgeBaseToDelete(null);
      } catch (error) {
        console.error('Delete failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete knowledge base. Please try again.';
        showToast(errorMessage, 'error');
        setDeleteModal(false);
        setKnowledgeBaseToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal(false);
    setKnowledgeBaseToDelete(null);
  };

  // Handle edit functionality
  const handleEditClick = (project: Project) => {
    setSelectedProject(project);
    setEditModal(true);
  };

  const handleUpdateKnowledgeBase = async (id: string, data: UpdateProjectInput) => {
    try {
      await updateKnowledgeBase(id, data);
      // Reload the data after successful update
      await initialLoad();
      showToast('Knowledge base updated successfully', 'success');
      setEditModal(false);
      setSelectedProject(null);
    } catch (error) {
      console.error('Update failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update knowledge base. Please try again.';
      showToast(errorMessage, 'error');
      setEditModal(false);
      setSelectedProject(null);
    }
  };

  const handleCancelEdit = () => {
    setEditModal(false);
    setSelectedProject(null);
  };

  // Initialize data on component mount
  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  return (
    <div className='h-full '>
      {/* Main Container with Mac-optimized responsive padding */}
      <div className='p-4 sm:p-6 lg:p-8'>
        {/* Page Header */}
        <div className='space-y-3 pb-3 '>
          <PageHeader
            title='Knowledge Base'
            subtitle='Manage your enterprise knowledge repositories'
          />
        </div>

        {/* Search and Filter Section */}
        <div className='mb-6 space-y-4 sm:mb-8'>
          {/* Search Bar */}
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex-1 sm:max-w-md'>
              <KnowledgeBaseSearch
                searchTerm={searchTerm}
                onSearchChange={handleKnowledgeBaseSearch}
                placeholder='Search knowledge bases'
              />
            </div>
            <div>
              <Button
                onClick={() => setOpenModal(true)}
                className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 4v16m8-8H4'
                  />
                </svg>
                Create Knowledge Base
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          /* Loading State with LoadingCard */
          <Loading />
        ) : projects.length > 0 ? (
          <div className='space-y-6'>
            {/* Knowledge Base Cards Grid - Optimized for Mac screens */}
            <div className='knowledge-base-grid grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5'>
              {projects.map((kb) => (
                <KnowledgeBaseCard
                  key={kb.id}
                  isActive={kb.is_active}
                  title={kb.name}
                  detail={kb.description}
                  updated={`Updated ${formatUpdatedTime(kb.updated_at || kb.created_at)}`}
                  onEdit={() => handleEditClick(kb)}
                  onDelete={() => handleDeleteClick(kb.id)}
                  onDetail={() => {
                    handleKnowledgeBaseClick(kb.id);
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            <KnowledgeBasePagination
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              endIndex={endIndex}
              totalItems={totalItems}
              onPageChange={handlePageChange}
            />
          </div>
        ) : (
          /* Empty State */
          <div className='flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-800'>
            <svg
              className='mx-auto h-12 w-12 text-gray-400 dark:text-gray-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            <h3 className='mt-4 text-lg font-medium text-gray-900 dark:text-white'>
              No knowledge bases found
            </h3>
            <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
              {searchTerm
                ? `No knowledge bases match your search "${searchTerm}"`
                : 'Get started by creating your first knowledge base.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setOpenModal(true)}
                className='mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
              >
                <svg
                  className='h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 4v16m8-8H4'
                  />
                </svg>
                Create Knowledge Base
              </button>
            )}
          </div>
        )}

        {/* Create Knowledge Base Modal */}
        <CreateKnowledgeBaseModal
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
          onSubmit={async (data) => {
            try {
              await createKnowledgeBase(data);
              showToast('Knowledge base created successfully', 'success');
              setOpenModal(false);
              // Force reload to show the new knowledge base
              await initialLoad();
            } catch (error) {
              console.error('Create knowledge base failed:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to create knowledge base. Please try again.';
              showToast(errorMessage, 'error');
            }
          }}
        />

        {/* Edit Knowledge Base Modal */}
        <EditKnowledgeBaseModal
          isOpen={editModal}
          onClose={handleCancelEdit}
          onSubmit={handleUpdateKnowledgeBase}
          project={selectedProject}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteModal}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </div>
  );
}
