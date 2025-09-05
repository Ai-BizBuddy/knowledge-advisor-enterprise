'use client';
import {
  CreateKnowledgeBaseModal,
  KnowledgeBaseCard,
  LoadingCard,
  PageHeader,
  Tabs,
} from '@/components';
import KnowledgeBasePagination from '@/components/knowledgeBasePagination';
import KnowledgeBaseSearch from '@/components/knowledgeBaseSearch';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { useEffect, useState } from 'react';

export default function KnowledgeBase() {
  const [openModal, setOpenModal] = useState(false);

  const {
    // State
    projects,
    loading,
    searchTerm,
    selectedTab,
    tabCounts,

    // Pagination
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    totalItems,

    initialLoad,

    // Handlers
    handleTabChange,
    handlePageChange,
    handleKnowledgeBaseClick,
    handleKnowledgeBaseDelete,
    searchKnowledgeBases,
    createKnowledgeBase,
  } = useKnowledgeBase();

  const tabList = [
    { label: 'All', count: tabCounts.all },
    { label: 'Active', count: tabCounts.active },
    { label: 'Inactive', count: tabCounts.inactive },
  ];

  const handleTabSelect = (tab: string) => {
    console.log('Selected tab:', tab);
    handleTabChange(tab);
  };

  const formatUpdatedTime = (updatedAt: string) => {
    const date = new Date(updatedAt);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleKnowledgeBaseSearch = async (query: string) => {
    await searchKnowledgeBases(query);
  };

  // Initialize data on component mount
  useEffect(() => {
    initialLoad();
  }, [initialLoad]);

  return (
    <div className='min-h-screen'>
      {/* Main Container with consistent responsive padding */}
      <div className='p-4 sm:p-6 lg:p-8'>
        {/* Page Header */}
        <div className='mb-6 sm:mb-8'>
          <PageHeader
            title='Knowledge Base'
            subtitle='Manage your enterprise knowledge repositories'
            action={
              <button
                className='flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-blue-700 sm:w-auto'
                onClick={() => setOpenModal(true)}
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={1.5}
                  stroke='currentColor'
                  className='h-5 w-5 flex-shrink-0'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <span className='text-sm font-medium'>New Knowledge Base</span>
              </button>
            }
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
                placeholder='Search knowledge bases by name, description, or category...'
              />
            </div>

            {/* Results Count */}
            <div className='flex items-center text-sm text-gray-600 dark:text-gray-400'>
              <span>
                {totalItems} knowledge base
                {totalItems !== 1 ? 's' : ''} found
              </span>
            </div>
          </div>

          {/* Tabs Section */}
          <div className='rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
            <Tabs
              currentTab={selectedTab}
              tabList={tabList.map((tab) => `${tab.label}`)}
              onTabChange={(value) => {
                // Extract the tab name without the count
                const tabName = value.split(' (')[0];
                handleTabSelect(tabName);
              }}
            />
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          /* Loading State with LoadingCard */
          <div className='space-y-6'>
            <LoadingCard
              count={10}
              variant='grid'
              message='Loading knowledge bases...'
              className=''
            />
          </div>
        ) : projects.length > 0 ? (
          <div className='space-y-6'>
            {/* Knowledge Base Cards Grid */}
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
              {projects.map((kb) => (
                <KnowledgeBaseCard
                  key={kb.id}
                  isActive={kb.is_active}
                  title={kb.name}
                  detail={kb.description}
                  updated={`Updated ${formatUpdatedTime(kb.updated_at || kb.created_at)}`}
                  onDelete={() => handleKnowledgeBaseDelete(kb.id)}
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
            await createKnowledgeBase(data);
            setOpenModal(false);
          }}
        />
      </div>
    </div>
  );
}
