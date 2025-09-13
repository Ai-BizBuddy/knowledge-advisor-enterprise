'use client';

import { Project } from '@/interfaces/Project';
import React from 'react';
import ChatTab from './ChatTab';
import DocumentList from './DocumentList';
import UserRole from './UserRole';



interface TabsContainerProps {
  knowledgeBase: Project | null;
  knowledgeBaseId: string;
  
  // Centralized tab state
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  tabsList: string[];
}

export const TabsContainer: React.FC<TabsContainerProps> = ({
  knowledgeBase,
  knowledgeBaseId,
  // Centralized tab state
  currentTab,
  setCurrentTab,
  tabsList,
}) => {


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

      </div>

     <DocumentTab 
        currentTab={currentTab}
        knowledgeBaseId={knowledgeBaseId}
      />

      {currentTab === 'Chat Assistant' && (
        <ChatTab
          knowledgeBase={knowledgeBase}
          knowledgeBaseId={knowledgeBaseId}
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
}

const DocumentTab: React.FC<DocumentTabProps> = ({
  currentTab,
  knowledgeBaseId,
}) => {
  return (
    <>
      {/* Tab Content */}
      {currentTab === 'Documents' && (
        <DocumentList
          knowledgeBaseId={knowledgeBaseId}
          isActive={currentTab === 'Documents'}
        />
      )}
    </>
  );
};

export default TabsContainer;
