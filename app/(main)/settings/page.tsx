'use client';

import { Card } from 'flowbite-react';
import Link from 'next/link';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useLoading } from '@/contexts/LoadingContext';
import { useEffect } from 'react';

const settingsOverview = [
  {
    title: 'Users',
    description: 'Manage user accounts, profiles, and access',
    href: '/settings/users',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    textColor: 'text-blue-900 dark:text-blue-100',
  },
  {
    title: 'Roles',
    description: 'Configure user roles and permission levels',
    href: '/settings/roles',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    textColor: 'text-purple-900 dark:text-purple-100',
  },
  {
    title: 'Permissions',
    description: 'Set up granular access controls',
    href: '/settings/permissions',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    textColor: 'text-emerald-900 dark:text-emerald-100',
  },
  {
    title: 'Departments',
    description: 'Organize users by departments',
    href: '/settings/departments',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    textColor: 'text-orange-900 dark:text-orange-100',
  },
];

export default function SettingsPage() {
  const { systemStatus } = useSystemStatus();
  const { setLoading } = useLoading();

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  return (
    <div className='space-y-8'>
      {/* Overview Cards */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        {settingsOverview.map((item) => (
          <Link key={item.title} href={item.href}>
            <Card
              className={`group h-full cursor-pointer border-gray-200 transition-all duration-200 hover:shadow-lg dark:border-gray-700 ${item.bgColor} ${item.borderColor}`}
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='mb-3'>
                    <h3
                      className={`text-lg font-semibold transition-colors group-hover:text-purple-600 dark:group-hover:text-purple-400 ${item.textColor}`}
                    >
                      {item.title}
                    </h3>
                  </div>
                  <p className='mb-4 text-sm text-gray-600 dark:text-gray-400'>
                    {item.description}
                  </p>
                </div>
                <div className='text-gray-400 transition-colors group-hover:text-purple-600 dark:text-gray-500 dark:group-hover:text-purple-400'>
                  <svg
                    className='h-5 w-5'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className='border-gray-200 dark:border-gray-700'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
              Quick Actions
            </h2>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Common administrative tasks
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          <Link
            href='/settings/users'
            className='flex items-center space-x-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
          >
            <div className='rounded-lg bg-blue-100 p-2 dark:bg-blue-900'>
              <div className='h-5 w-5 rounded bg-blue-600 dark:bg-blue-400'></div>
            </div>
            <div>
              <div className='font-medium text-gray-900 dark:text-white'>
                Add New User
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                Create a new user account
              </div>
            </div>
          </Link>

          <Link
            href='/settings/roles'
            className='flex items-center space-x-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
          >
            <div className='rounded-lg bg-purple-100 p-2 dark:bg-purple-900'>
              <div className='h-5 w-5 rounded bg-purple-600 dark:bg-purple-400'></div>
            </div>
            <div>
              <div className='font-medium text-gray-900 dark:text-white'>
                Create Role
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                Define a new user role
              </div>
            </div>
          </Link>

          <Link
            href='/settings/departments'
            className='flex items-center space-x-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'
          >
            <div className='rounded-lg bg-orange-100 p-2 dark:bg-orange-900'>
              <div className='h-5 w-5 rounded bg-orange-600 dark:bg-orange-400'></div>
            </div>
            <div>
              <div className='font-medium text-gray-900 dark:text-white'>
                Add Department
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                Create a new department
              </div>
            </div>
          </Link>
        </div>
      </Card>

      {/* System Status */}
      <Card className='border-gray-200 dark:border-gray-700'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
              System Status
            </h2>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Current system information
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <div className='h-2 w-2 rounded-full bg-green-500'></div>
            <span className='text-sm font-medium text-green-600 dark:text-green-400'>
              Operational
            </span>
          </div>
        </div>

        {systemStatus.loading ? (
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div className='animate-pulse rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700'>
              <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                ...
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                Total Users
              </div>
            </div>
            <div className='animate-pulse rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700'>
              <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                ...
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                Active Sessions
              </div>
            </div>
            <div className='animate-pulse rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700'>
              <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                ...
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                System Roles
              </div>
            </div>
          </div>
        ) : systemStatus.error ? (
          <div className='p-4 text-center text-red-500'>
            {systemStatus.error}
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
            <div className='rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700'>
              <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                {systemStatus.totalUsers}
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                Total Users
              </div>
            </div>
            <div className='rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700'>
              <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                {systemStatus.activeSessions}
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                Active Sessions
              </div>
            </div>
            <div className='rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-700'>
              <div className='text-2xl font-bold text-gray-900 dark:text-white'>
                {systemStatus.systemRoles}
              </div>
              <div className='text-sm text-gray-600 dark:text-gray-400'>
                System Roles
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
