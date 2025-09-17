import { Card } from 'flowbite-react';
import { IStatusCardProps } from '../../interfaces/StatusCard';

/**
 * StatusCard component displays a statistic with an icon
 * Fully responsive design for all screen sizes
 * Supports error and loading states
 */
export default function StatusCard({
  name,
  value,
  icon,
  color,
  error = false,
  loading = false,
}: IStatusCardProps) {
  const getDisplayValue = () => {
    if (loading) return 'Loading...';
    if (error) return 'Error';
    return value;
  };

  const getIcon = () => {
    if (error) {
      return (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='currentColor'
        >
          <path
            fillRule='evenodd'
            d='M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z'
            clipRule='evenodd'
          />
        </svg>
      );
    }
    if (loading) {
      return (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='currentColor'
          className='animate-spin'
        >
          <path d='M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm0 16a6 6 0 1 1 6-6 6.007 6.007 0 0 1-6 6Z' />
          <path d='M12 6a6 6 0 0 1 6 6h2a8 8 0 0 0-8-8Z' />
        </svg>
      );
    }
    return icon;
  };

  const getColor = () => {
    if (error) return 'bg-red-500/10 text-red-400';
    if (loading) return 'bg-gray-500/10 text-gray-400';
    return color;
  };

  return (
    <Card className='min-h-[100px] w-full border-gray-200 transition-shadow duration-200 hover:shadow-lg sm:min-h-[120px] dark:border-gray-700 dark:bg-gray-800'>
      <div className='flex h-full flex-row items-center justify-between p-2 sm:p-4'>
        <div className='flex min-w-0 flex-1 flex-col justify-center'>
          <p className='mb-1 truncate text-xs font-medium text-gray-500 sm:text-sm dark:text-gray-400'>
            {name}
          </p>
          <p className={`truncate text-lg font-bold sm:text-xl lg:text-2xl ${
            error 
              ? 'text-red-500 dark:text-red-400' 
              : loading 
              ? 'text-gray-500 dark:text-gray-400'
              : 'text-gray-900 dark:text-white'
          }`}>
            {getDisplayValue()}
          </p>
        </div>
        <div
          className={`${getColor()} ml-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12`}
        >
          <div className='h-5 w-5 sm:h-6 sm:w-6'>{getIcon()}</div>
        </div>
      </div>
    </Card>
  );
}
