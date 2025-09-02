interface DocumentsSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isDeepSearch?: boolean;
  handleDeepSearchClear?: () => void;
  onDeepSearchClick?: () => void;
}

export const DocumentsSearch: React.FC<DocumentsSearchProps> = ({
  searchTerm,
  onSearchChange,
  isDeepSearch,
  handleDeepSearchClear,
  onDeepSearchClick
}) => {
  return (
    <div className='relative w-[80%]'>
      <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
        <svg
          className='h-5 w-5 text-gray-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          />
        </svg>
      </div>
      <input
        type='text'
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder='Search documents'
        className='w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:placeholder-gray-400'
      />
      <div className='absolute inset-y-0 right-0 flex'>
      {isDeepSearch && (
          <button
            onClick={handleDeepSearchClear}
            className='flex items-center px-3 text-gray-500 transition-colors hover:text-gray-700 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-gray-200'
            title='Clear search'
          >
            Clear
          </button>
      )}

      {onDeepSearchClick && (
        <button
          className='p-2 h-full text-sm font-medium text-white bg-blue-700 rounded-e-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 cursor-pointer'
          onClick={() => onDeepSearchClick()}
        >
            {/* <svg
              className='h-5 w-5 flex-shrink-0'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg> */}
            <span className='text-sm font-medium'>Deep Search</span>
            {/* <svg
              className='h-4 w-4 flex-shrink-0 opacity-75'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 7l5 5m0 0l-5 5m5-5H6'
              />
            </svg> */}
          </button>
      )}
      </div>
    </div>
  );
};
