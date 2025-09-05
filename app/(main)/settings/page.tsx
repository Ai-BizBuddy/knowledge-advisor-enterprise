'use client';

import { DepartmentsPage, PermissionsPage, RolesPage, UsersPage } from '@/components/SettingsPage';
import { useLoading } from '@/contexts/LoadingContext';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import {
  Card,
  TabItem,
  Tabs
} from 'flowbite-react';
import { useEffect } from 'react';

export default function SettingsPage() {
  const { setLoading } = useLoading();
  const { systemStatus } = useSystemStatus();

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  return (
    <div className='space-y-6'>
      {/* System status summary */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <Card>
          <div className='flex items-center'>
            <div className='rounded-lg bg-blue-100 p-3 dark:bg-blue-900'>
              <svg className='h-6 w-6 text-blue-600 dark:text-blue-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>Total Users</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>{systemStatus.loading ? '...' : systemStatus.totalUsers}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center'>
            <div className='rounded-lg bg-green-100 p-3 dark:bg-green-900'>
              <svg className='h-6 w-6 text-green-600 dark:text-green-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>Active Sessions</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>{systemStatus.loading ? '...' : systemStatus.activeSessions}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className='flex items-center'>
            <div className='rounded-lg bg-purple-100 p-3 dark:bg-purple-900'>
              <svg className='h-6 w-6 text-purple-600 dark:text-purple-300' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
              </svg>
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>System Roles</p>
              <p className='text-2xl font-bold text-gray-900 dark:text-white'>{systemStatus.loading ? '...' : systemStatus.systemRoles}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs: Users | Roles | Permissions | Departments */}
      <Card className='p-2'>
  <Tabs aria-label='Settings tabs' variant='underline'>
          <TabItem active title='Users'>
            <UsersPage />
          </TabItem>

          <TabItem title='Roles'>
            <RolesPage />
          </TabItem>

          <TabItem title='Permissions'>
            <PermissionsPage />
          </TabItem>

          <TabItem title='Departments'>
            <DepartmentsPage />
          </TabItem>
        </Tabs>
      </Card>
    </div>
  );
}
