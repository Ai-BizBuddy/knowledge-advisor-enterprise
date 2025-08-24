interface KnowledgeBaseSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
}

export default function KnowledgeBaseSearch({
  searchTerm,
  onSearchChange,
  placeholder = 'Search knowledge bases...',
}: KnowledgeBaseSearchProps) {
  return (
    <div className='relative'>
      {/* Search Icon */}
      <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
        <svg
          className='h-4 w-4 text-gray-400 dark:text-gray-500'
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

      {/* Search Input */}
      <input
        type='text'
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className='block w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-10 pl-10 text-sm text-gray-900 placeholder-gray-500 transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500'
      />

      {/* Clear Button */}
      {searchTerm && (
        <button
          type='button'
          onClick={() => onSearchChange('')}
          className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:text-gray-600 focus:outline-none dark:text-gray-500 dark:hover:text-gray-300 dark:focus:text-gray-300'
          aria-label='Clear search'
        >
          <svg
            className='h-4 w-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M6 18L18 6M6 6l12 12'
            />
          </svg>
        </button>
      )}
    </div>
  );
}
