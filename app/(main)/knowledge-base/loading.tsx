import { LoadingCard } from '@/components/LoadingCard';

export default function Loading() {
  return (
    <div className='h-full'>
      {/* Main Container with Mac-optimized responsive padding */}
      <div className='p-4 sm:p-6 lg:p-8 xl:p-10 2xl:px-12'>

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
