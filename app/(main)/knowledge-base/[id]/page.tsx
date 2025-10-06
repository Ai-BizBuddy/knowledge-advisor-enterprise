'use client';

import {
  AppLoading,
  TabsContainer
} from '@/components';
import { useLoading } from '@/contexts/LoadingContext';
import { formatStatus } from '@/data/knowledgeBaseData';
import { useKnowledgeBase } from '@/hooks';
import { Project } from '@/interfaces/Project';
import { Breadcrumb, BreadcrumbItem } from 'flowbite-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';



export default function KnowledgeBaseDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { setLoading } = useLoading();

  // Knowledge base state
  const [knowledgeBaseState, setKnowledgeBaseState] = useState({
    data: null as Project | null,
    loading: true,
    error: null as string | null
  });

  // Centralized tab state management
  const [currentTab, setCurrentTab] = useState('Documents');
  
    // Dynamic tabs list based on knowledge base visibility
  const tabsList = useMemo(() => 
    knowledgeBaseState.data?.visibility === 'custom'
      ? ['Documents', 'Chat Assistant', 'Users', 'Settings']
      : ['Documents', 'Chat Assistant', 'Settings'], 
    [knowledgeBaseState.data?.visibility]
  );



  // Handle tab changes
  const handleTabChange = useCallback((newTab: string) => {
    setCurrentTab(newTab);
  }, []);

  const { getKnowledgeBase } = useKnowledgeBase();

  const handleBackButtonClick = () => {
    setLoading(true);
    router.push('/knowledge-base');
  };

  useEffect(() => {
    const fetchKnowledgeBase = async (kbId: string) => {
      try {
        setKnowledgeBaseState(prev => ({ ...prev, loading: true, error: null }));
        const kb = await getKnowledgeBase(kbId);
        setKnowledgeBaseState(prev => ({ ...prev, data: kb, loading: false }));
        if (!kb) {
          setKnowledgeBaseState(prev => ({ ...prev, error: 'Knowledge base not found' }));
        }
        
      } catch (error) {
        console.error('Error fetching knowledge base:', error);
        setKnowledgeBaseState(prev => ({
          ...prev,
          error: error instanceof Error
            ? error.message
            : 'Failed to load knowledge base',
          data: null,
          loading: false
        }));
      } finally {
        setKnowledgeBaseState(prev => ({ ...prev, loading: false }));
      }
    };
    
    if (id) {
      fetchKnowledgeBase(id);
    }
  }, [getKnowledgeBase, id]);

  // Show loading state while fetching knowledge base
  if (knowledgeBaseState.loading) {
    return (
      <div className='min-h-screen p-3 sm:p-6 lg:p-8'>
        <AppLoading variant='default' message='Loading knowledge base...' />
      </div>
    );
  }

  // Show error state if knowledge base not found or error occurred
  if (knowledgeBaseState.error || !knowledgeBaseState.data) {
    return (
      <div className='min-h-screen p-3 sm:p-6 lg:p-8'>
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
            {knowledgeBaseState.error || 'Knowledge Base Not Found'}
          </h3>
          <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
            {knowledgeBaseState.error
              ? 'There was an error loading the knowledge base. Please try again.'
              : "The knowledge base you're looking for doesn't exist or has been removed."}
          </p>
          <button
            onClick={handleBackButtonClick}
            className='mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
          >
            Back to Knowledge Bases
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className=' p-3 sm:p-6 lg:p-8'>
      {/* Header Section */}
      <div className='mb-4 sm:mb-6'>
        <Breadcrumb
          aria-label='Breadcrumb'
          className='flex items-center gap-3 sm:gap-4'
        >
          <BreadcrumbItem href='/knowledge-base'>Knowledge Base</BreadcrumbItem>
          <BreadcrumbItem>{knowledgeBaseState.data.name}</BreadcrumbItem>
        </Breadcrumb>
        <div className='flex items-center gap-3 pt-5 sm:gap-4'>
          {/* Title Section */}
          <div className='min-w-0 flex-1'>
            <div className='mb-2 flex items-center gap-3'>
              <h1 className='text-xl font-bold text-gray-900 sm:text-2xl dark:text-white'>
                {knowledgeBaseState.data.name}
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  knowledgeBaseState.data.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : !knowledgeBaseState.data.is_active
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                }`}
              >
                {formatStatus(knowledgeBaseState.data.is_active)}
              </span>
            </div>
            <p className='mt-1 text-sm text-gray-600 sm:text-base dark:text-gray-400'>
              {knowledgeBaseState.data.description}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Container with centralized state management */}
      <TabsContainer 
        knowledgeBase={knowledgeBaseState.data}
        knowledgeBaseId={id}
        // Centralized tab state
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        tabsList={tabsList}
      />
    </div>
  );
}
