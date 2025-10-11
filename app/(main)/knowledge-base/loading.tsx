import { LoadingCard } from '@/components/LoadingCard';

export default function Loading() {
  return (
    <div className='h-full'>
      {/* Main Container with Mac-optimized responsive padding */}
      <div className='space-y-6'>

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
