'use client';

import { Progress } from 'flowbite-react';
import React from 'react';

export interface BaseProgressProps {
  progress: number;
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'indigo' | 'purple' | 'pink' | 'gray';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

/**
 * Unified Progress component using Flowbite with consistent styling
 */
export const BaseProgress: React.FC<BaseProgressProps> = ({
  progress,
  color = 'blue',
  size = 'md',
  label,
  showPercentage = false,
  className = '',
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>{label}</span>
          {showPercentage && (
            <span className='text-sm text-gray-500 dark:text-gray-400'>{progress}%</span>
          )}
        </div>
      )}
      
      <Progress
        progress={progress}
        color={color}
        size={size}
        className='w-full'
      />
    </div>
  );
};
