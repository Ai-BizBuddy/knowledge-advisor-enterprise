'use client';

import { UserManagementTab } from '@/components/knowledgeBaseUsers';
import React from 'react';

interface UserRoleProps {
  knowledgeBaseId: string;
  isActive: boolean; // Only load data when this tab is active
}

export const UserRole: React.FC<UserRoleProps> = ({
  knowledgeBaseId,
  isActive,
}) => {
  // Only render the component when the tab is active to prevent unnecessary data loading
  if (!isActive) {
    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-gray-500 dark:text-gray-400'>
          User management will load when you select this tab.
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4 sm:space-y-6'>
      <UserManagementTab knowledgeBaseId={knowledgeBaseId} />
    </div>
  );
};

export default UserRole;
