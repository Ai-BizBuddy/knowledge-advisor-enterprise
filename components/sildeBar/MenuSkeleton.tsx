'use client';

import React from 'react';

/**
 * MenuSkeleton Component
 * 
 * Displays skeleton loading for sidebar navigation menu items.
 * Matches the structure of actual NavigationMenu items.
 */
export const MenuSkeleton: React.FC = () => {
  // Generate 6 skeleton menu items (typical sidebar menu count)
  const skeletonItems = Array.from({ length: 6 }, (_, index) => index);

  return (
    <nav className='flex flex-1 flex-col px-3'>
      <ul role='list' className='flex flex-1 flex-col gap-y-7'>
        <li>
          <ul role='list' className='-mx-2 space-y-1'>
            {skeletonItems.map((index) => (
              <li 
                key={index} 
                className='animate-pulse'
                style={{
                  // Staggered animation delay for each item
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className='group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'>
                  {/* Icon skeleton */}
                  <div className='h-6 w-6 flex-shrink-0 rounded bg-gray-300 dark:bg-gray-600'></div>
                  
                  {/* Text skeleton - vary width for realistic look */}
                  <div 
                    className='h-6 rounded bg-gray-300 dark:bg-gray-600'
                    style={{ 
                      width: `${60 + (index * 15) % 40}%` // Vary between 60-100%
                    }}
                  ></div>
                </div>
              </li>
            ))}
          </ul>
        </li>
        
        {/* Optional: Add shimmer effect overlay */}
        <style jsx>{`
          @keyframes shimmer {
            0% {
              background-position: -1000px 0;
            }
            100% {
              background-position: 1000px 0;
            }
          }
        `}</style>
      </ul>
    </nav>
  );
};

export default MenuSkeleton;
