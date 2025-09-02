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
    <div className='flex w-full gap-2'>
      {/* Search Input - Takes ~80% */}
      <div className='relative flex-1'>
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
        {isDeepSearch && (
          <button
            onClick={handleDeepSearchClear}
            className='absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 transition-colors hover:text-gray-700 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:text-gray-200'
            title='Clear search'
          >
            Clear
          </button>
        )}
      </div>

      {/* Deep Search Button - Takes ~20% */}
      {onDeepSearchClick && (
        <button
          className='px-4 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 cursor-pointer whitespace-nowrap flex-shrink-0'
          onClick={() => onDeepSearchClick()}
        >
          <span className='text-sm font-medium'>Deep Search</span>
        </button>
      )}
    </div>
  );
};
