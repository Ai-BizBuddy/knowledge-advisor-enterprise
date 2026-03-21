
export const getStatusBadge = (status: string | null | undefined) => {
  if (!status) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }

  const statusConfig = {
    // Capitalized versions (Display format)
    Uploaded: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    Queued: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    Processing:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    Archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    Completed:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    Failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    OcrinProgress:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    Synced: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'Not Synced':
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    Syncing:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',

    // Lowercase versions (Database format)
    uploaded: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    queued: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    processing:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    ready: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    archived: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    completed:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    synced: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    not_synced: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    'not synced':
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    syncing:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',

    // Additional status variations
    'in-progress':
      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    pending:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    success:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  };

  return (
    statusConfig[status as keyof typeof statusConfig] ||
    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  );
};

export const isErrorStatus = (status: string | null | undefined): boolean => {
  if (!status) return false;
  const lowerStatus = status.toLowerCase();
  return lowerStatus === 'error' || lowerStatus === 'failed';
};

export const getStatusIcon = (status: string | null | undefined) => {
  const lowerStatus = status?.toLowerCase() || '';
  
  switch (lowerStatus) {
    case 'uploaded':
      return (
        <svg className='mr-1 h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
        </svg>
      );
    case 'queued':
      return (
        <svg className='mr-1 h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
        </svg>
      );
    case 'processing':
      return (
        <svg className='mr-1 h-3 w-3 animate-spin' fill='none' viewBox='0 0 24 24'>
          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
        </svg>
      );
    case 'ready':
      return (
        <svg className='mr-1 h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
        </svg>
      );
    case 'error':
    case 'failed':
      return (
        <svg className='mr-1 h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' />
        </svg>
      );
    case 'archived':
      return (
        <svg className='mr-1 h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' />
        </svg>
      );
    case 'synced':
    case 'completed':
      return (
        <svg className='mr-1 h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
        </svg>
      );
    case 'syncing':
      return (
        <svg className='mr-1 h-3 w-3 animate-spin' fill='none' viewBox='0 0 24 24'>
          <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
          <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
        </svg>
      );
    default:
      return null;
  }
};

export const renderStatusBadge = (
  status: string | null | undefined,
  errorMessage?: string,
) => {
  const statusClasses = getStatusBadge(status);
  const isError = isErrorStatus(status);
  const displayStatus = status && status.trim() !== '' ? status : 'Unknown';
  const statusIcon = getStatusIcon(status);

  if (isError && errorMessage) {
    return (
      <div className='group relative inline-flex'>
        <span
          className={`inline-flex cursor-help items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses}`}
        >
          {statusIcon}
          {displayStatus}
          <svg
            className='ml-1 h-3 w-3'
            fill='currentColor'
            viewBox='0 0 20 20'
            aria-hidden='true'
          >
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z'
              clipRule='evenodd'
            />
          </svg>
        </span>

        {/* Tooltip */}
        <div className='pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 max-w-xs min-w-max -translate-x-1/2 transform rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 dark:bg-gray-700'>
          <div className='mb-1 font-medium'>Error Details:</div>
          <div>{errorMessage}</div>
          {/* Tooltip arrow */}
          <div className='absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 transform bg-gray-900 dark:bg-gray-700'></div>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClasses}`}
    >
      {statusIcon}
      {displayStatus}
    </span>
  );
};
