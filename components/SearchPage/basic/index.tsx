'use client';

import { SearchBar } from '@/components';
import { DeepSearchLayout } from '@/components/deepSearch';
import KnowledgeSelect from '@/components/knowledgeSelect';
import { useKnowledgeBaseSelection } from '@/hooks';
import { useDeepSearch } from '@/hooks/useDeepSarch';
import { DocumentSearchResult } from '@/interfaces/DeepSearchTypes';
import { Card } from 'flowbite-react';
import { useState } from 'react';

export default function BasicSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const resultsPerPage = 10;

  const { results, loading, error, executeSearch } = useDeepSearch();
  
  const {
    knowledgeBases,
    handleSelectKnowledgeBase,
    handleSelectAllKB,
    getSelectedKnowledgeBases,
    getSelectedCount,
  } = useKnowledgeBaseSelection();

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setSearchQuery(query);
    setCurrentPage(1);

    try {
      const selectedKBs = getSelectedKnowledgeBases();
      const searchPayload = {
        query: query.trim(),
        knowledge_base_ids: selectedKBs.length > 0 ? selectedKBs.map(kb => kb.id) : [],
        limit: resultsPerPage,
        offset: 0
      };

      const response = await executeSearch(searchPayload);
      
      // Convert response to DocumentSearchResult format
      const formattedResults: DocumentSearchResult[] = response.map((result, index) => ({
        id: result.metadata?.document_id || `result-${index}`,
        title: result.metadata?.file_name || 'Untitled Document',
        content: result.content || '',
        fileType: result.metadata?.file_name?.split('.').pop() || 'unknown',
        fileSize: '0 KB', // Not available in current response
        uploadDate: new Date().toISOString(), // Not available in current response
        knowledgeName: result.metadata?.knowledge_id || '',
        fileUrl: undefined // Not available in current response
      }));

      setSearchResults(formattedResults);
      setTotalResults(formattedResults.length);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
      setTotalResults(0);
    }
  };

  const handleResultClick = (result: DocumentSearchResult) => {
    // Handle result click - could open document preview or navigate
    console.log('Clicked result:', result);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // In a real implementation, you'd fetch new results for the page
  };

  const totalPages = Math.ceil(totalResults / resultsPerPage);
  const isNoResults = Boolean(searchQuery && searchResults.length === 0 && !loading);

  return (
    <div className='space-y-6'>
      {/* Knowledge Base Selection */}
      <Card className='p-4 sm:p-6'>
        <div className='space-y-4'>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
            <span className='text-sm font-semibold whitespace-nowrap text-gray-700 dark:text-gray-200'>
              Search in Knowledge Base:
            </span>
            <div className='flex-1'>
              <KnowledgeSelect
                options={knowledgeBases}
                onChange={(data) => handleSelectKnowledgeBase(data)}
                onChangeAll={handleSelectAllKB}
              />
            </div>
          </div>
          
          {getSelectedCount() > 0 && (
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              Selected: {getSelectedCount()} Knowledge Base{getSelectedCount() > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </Card>

      {/* Search Bar */}
      <Card className='p-4 sm:p-6'>
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
            Basic AI Search
          </h3>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Search through your documents using natural language. Try questions like &quot;What is the company policy on remote work?&quot; or &quot;ข้อมูลเกี่ยวกับการก่อสร้าง&quot;
          </p>
          <SearchBar onSearch={handleSearch} />
          
          {error && (
            <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800'>
              <p className='text-sm text-red-600 dark:text-red-400'>
                Search error: {error.message}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Search Results */}
      {(searchQuery || searchResults.length > 0 || loading) && (
        <Card className='p-4 sm:p-6'>
          <DeepSearchLayout
            searchQuery={searchQuery}
            searchResults={searchResults}
            loading={loading}
            isSearching={loading}
            isNoResults={isNoResults}
            onResultClick={handleResultClick}
            currentPage={currentPage}
            totalPages={totalPages}
            resultsPerPage={resultsPerPage}
            totalResults={totalResults}
            onPageChange={handlePageChange}
          />
        </Card>
      )}
    </div>
  );
}
