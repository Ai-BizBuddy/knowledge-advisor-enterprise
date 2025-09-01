'use client';
import { IRecentActivityCardProps } from '@/interfaces/RecentActivityCard';
import { Card } from 'flowbite-react';
import { useEffect, useState } from 'react';

export default function RecentActivityCard({
  activities,
}: IRecentActivityCardProps) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <Card className='h-full border-gray-200 xl:w-full dark:border-gray-700 dark:bg-gray-800'>
      <div className='p-2 sm:p-4'>
        <h5 className='mb-4 text-lg font-bold text-gray-900 sm:text-xl dark:text-white'>
          Recent Activity
        </h5>

        <ul className='space-y-0 divide-y divide-gray-200 dark:divide-gray-600'>
          {activities.map((activity, index) => (
            <li
              key={index}
              className='flex items-start gap-3 py-3 first:pt-0 last:pb-0 sm:py-4'
            >
              <div className='flex-shrink-0'>
                <svg
                  className='mt-0.5 h-5 w-5 text-blue-500 sm:h-6 sm:w-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    fillRule='evenodd'
                    d='M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='min-w-0 flex-1'>
                <p className='mb-1 text-sm font-medium text-gray-900 sm:text-base dark:text-white'>
                  {activity.title}
                </p>
                {activity.description && (
                  <p className='mb-2 line-clamp-2 text-xs text-gray-600 sm:text-sm dark:text-gray-300'>
                    {activity.description}
                  </p>
                )}
                {/* Only render timestamp after hydration to avoid SSR mismatch */}
                {hydrated && (
                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                    {activity.timestamp}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
