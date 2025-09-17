'use client';

import { SearchBar } from '@/components';
import { AdvancedSearchModal, DeepSearchLayout } from '@/components/deepSearch';
import KnowledgeSelect from '@/components/knowledgeSelect';
import { useKnowledgeBaseSelection } from '@/hooks';
import { useDeepSearch } from '@/hooks/useDeepSarch';
import { DocumentSearchResult } from '@/interfaces/DeepSearchTypes';
import { Button, Card } from 'flowbite-react';
import { useState } from 'react';

interface AdvancedSearchConfig {
  query: string;
  dateRange: {
    start?: string;
    end?: string;
  };
  contentTypes: string[];
  sources: string[];
  relevanceThreshold: number;
  includeMetadata: boolean;
}

export default function AdvancedSearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedConfig, setAdvancedConfig] = useState<AdvancedSearchConfig>({
    query: '',
    dateRange: {},
    contentTypes: [],
    sources: [],
    relevanceThreshold: 0.5,
    includeMetadata: false,
  });
  const resultsPerPage = 10;

  const { results, loading, error, executeSearch } = useDeepSearch();
  
  const {
    knowledgeBases,
    handleSelectKnowledgeBase,
    handleSelectAllKB,
    getSelectedKnowledgeBases,
    getSelectedCount,
  } = useKnowledgeBaseSelection();

  const handleBasicSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setSearchQuery(query);
    setCurrentPage(1);
    await performSearch(query, advancedConfig);
  };

  const handleAdvancedSearch = async (config: AdvancedSearchConfig) => {
    setAdvancedConfig(config);
    setSearchQuery(config.query);
    setCurrentPage(1);
    await performSearch(config.query, config);
    setShowAdvancedModal(false);
  };

  const performSearch = async (query: string, config: AdvancedSearchConfig) => {
    try {
      const selectedKBs = getSelectedKnowledgeBases();
      const searchPayload = {
        query: query.trim(),
        knowledge_base_ids: selectedKBs.length > 0 ? selectedKBs.map(kb => kb.id) : [],
        limit: resultsPerPage,
        offset: 0,
        // Advanced search parameters
        content_types: config.contentTypes,
        date_range: config.dateRange,
        relevance_threshold: config.relevanceThreshold,
        include_metadata: config.includeMetadata
      };

      const response = await executeSearch(searchPayload);
      
      // Convert response to DocumentSearchResult format
      const formattedResults: DocumentSearchResult[] = response
        .filter(result => !config.relevanceThreshold || result.similarity >= config.relevanceThreshold)
        .map((result, index) => ({
          id: result.metadata?.document_id || `result-${index}`,
          title: result.metadata?.file_name || 'Untitled Document',
          content: result.content || '',
          fileType: result.metadata?.file_name?.split('.').pop() || 'unknown',
          fileSize: '0 KB',
          uploadDate: new Date().toISOString(),
          knowledgeName: result.metadata?.knowledge_id || '',
          fileUrl: undefined
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
    console.log('Clicked result:', result);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
                onChange={(data: string) => handleSelectKnowledgeBase(data)}
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

      {/* Advanced Search Controls */}
      <Card className='p-4 sm:p-6'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
              Advanced AI Search
            </h3>
            <Button
              color='blue'
              size='sm'
              onClick={() => setShowAdvancedModal(true)}
            >
              Advanced Filters
            </Button>
          </div>
          
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Perform detailed searches with file type filters, date ranges, and relevance thresholds. Perfect for finding specific documents or content types.
          </p>
          
          <SearchBar onSearch={handleBasicSearch} />

          {/* Active Filters Display */}
          {(advancedConfig.contentTypes.length > 0 || advancedConfig.dateRange.start || advancedConfig.relevanceThreshold !== 0.5) && (
            <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800'>
              <h4 className='text-sm font-medium text-blue-800 dark:text-blue-200 mb-2'>Active Filters:</h4>
              <div className='flex flex-wrap gap-2'>
                {advancedConfig.contentTypes.map(type => (
                  <span key={type} className='px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded dark:bg-blue-800 dark:text-blue-100'>
                    {type.toUpperCase()}
                  </span>
                ))}
                {advancedConfig.dateRange.start && (
                  <span className='px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded dark:bg-blue-800 dark:text-blue-100'>
                    From: {advancedConfig.dateRange.start}
                  </span>
                )}
                {advancedConfig.dateRange.end && (
                  <span className='px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded dark:bg-blue-800 dark:text-blue-100'>
                    To: {advancedConfig.dateRange.end}
                  </span>
                )}
                {advancedConfig.relevanceThreshold !== 0.5 && (
                  <span className='px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded dark:bg-blue-800 dark:text-blue-100'>
                    Min Relevance: {Math.round(advancedConfig.relevanceThreshold * 100)}%
                  </span>
                )}
              </div>
              <Button
                size='xs'
                color='light'
                className='mt-2'
                onClick={() => {
                  setAdvancedConfig({
                    query: '',
                    dateRange: {},
                    contentTypes: [],
                    sources: [],
                    relevanceThreshold: 0.5,
                    includeMetadata: false,
                  });
                  setSearchResults([]);
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
          
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

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={showAdvancedModal}
        onClose={() => setShowAdvancedModal(false)}
        onSearch={handleAdvancedSearch}
      />
    </div>
  );
}
