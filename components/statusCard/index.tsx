import { Card } from 'flowbite-react';
import { IStatusCardProps } from '../../interfaces/StatusCard';

/**
 * StatusCard component displays a statistic with an icon
 * Fully responsive design for all screen sizes
 */
export default function StatusCard({
  name,
  value,
  icon,
  color,
}: IStatusCardProps) {
  return (
    <Card className='min-h-[100px] w-full border-gray-200 transition-shadow duration-200 hover:shadow-lg sm:min-h-[120px] dark:border-gray-700 dark:bg-gray-800'>
      <div className='flex h-full flex-row items-center justify-between p-2 sm:p-4'>
        <div className='flex min-w-0 flex-1 flex-col justify-center'>
          <p className='mb-1 truncate text-xs font-medium text-gray-500 sm:text-sm dark:text-gray-400'>
            {name}
          </p>
          <p className='truncate text-lg font-bold text-gray-900 sm:text-xl lg:text-2xl dark:text-white'>
            {value}
          </p>
        </div>
        <div
          className={`${color} ml-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12`}
        >
          <div className='h-5 w-5 sm:h-6 sm:w-6'>{icon}</div>
        </div>
      </div>
    </Card>
  );
}
