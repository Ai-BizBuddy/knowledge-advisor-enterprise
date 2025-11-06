'use client';

import { ERROR_MESSAGES, ROUTES } from '@/constants';
import Link from 'next/link';
import type { AccessDeniedProps } from './AccessDenied.types';

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = ERROR_MESSAGES.FORBIDDEN,
  message = 'You do not have permission to view this content. If you believe this is an error, please contact your administrator.',
  actionHref = ROUTES.DASHBOARD,
  actionLabel = 'Go to Dashboard',
  className = '',
}) => {
  return (
    <div className={`mx-auto mt-6 max-w-2xl rounded-xl border border-slate-700/50 bg-slate-900/80 p-8 text-center shadow-sm backdrop-blur-xl ${className}`}>
      <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10'>
        <svg
          className='h-6 w-6 text-red-500'
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='currentColor'
        >
          <path
            fillRule='evenodd'
            d='M12 1.75a2.25 2.25 0 0 1 2.25 2.25v2.087a8.25 8.25 0 1 1-4.5 0V4A2.25 2.25 0 0 1 12 1.75Zm-.75 8a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0V9.75Zm.75 7.5a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25Z'
            clipRule='evenodd'
          />
        </svg>
      </div>
      <h2 className='text-xl font-semibold text-slate-100'>{title}</h2>
      <p className='mt-2 text-sm text-slate-400'>{message}</p>
      {actionHref && (
        <div className='mt-6'>
          <Link
            href={actionHref}
            className='inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700'
          >
            {actionLabel}
          </Link>
        </div>
      )}
    </div>
  );
};
