import { PageHeader } from '@/components';
import { LoadingCard } from '@/components/LoadingCard';

export default function Loading() {
  return (
    <div className='h-full'>
      {/* Main Container with Mac-optimized responsive padding */}
      <div className='p-4 sm:p-6 lg:p-8 xl:p-10 2xl:px-12'>
        {/* Page Header */}
        <div className='space-y-3 pb-3 mb-6 sm:mb-8'>
          <PageHeader
            title='Knowledge Base'
            subtitle='Manage your enterprise knowledge repositories'
          />
        </div>

        {/* Search and Filter Section Skeleton */}
        <div className='mb-6 space-y-4 sm:mb-8'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex-1 sm:max-w-md'>
              <div className='h-10 bg-gray-200 rounded-lg animate-pulse dark:bg-gray-700'></div>
            </div>
            <div>
              <div className='h-10 w-40 bg-blue-200 rounded-lg animate-pulse dark:bg-blue-800'></div>
            </div>
          </div>
        </div>

        {/* Loading Cards Grid - Mac optimized */}
        <LoadingCard 
          count={12} 
          variant='grid' 
          className='knowledge-base-grid'
        />
      </div>
    </div>
  );
}
