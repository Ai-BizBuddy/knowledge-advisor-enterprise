interface NoDocumentsProps {
  activeTab: string;
  setOpenModal?: (open: boolean) => void;
}
export default function NoDocuments({
  activeTab,
  setOpenModal,
}: NoDocumentsProps) {
  return (
    <div className='flex w-3/4 flex-col items-center gap-4 rounded-2xl border-gray-700/50 bg-gray-100 p-6 shadow dark:bg-gray-900'>
      <div>
        <svg
          className='h-12 w-12 text-gray-500 dark:text-gray-500'
          aria-hidden='true'
          xmlns='http://www.w3.org/2000/svg'
          width='24'
          height='24'
          fill='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            fillRule='evenodd'
            d='M6 2a2 2 0 0 0-2 2v15a3 3 0 0 0 3 3h12a1 1 0 1 0 0-2h-2v-2h2a1 1 0 0 0 1-1V4a2 2 0 0 0-2-2h-8v16h5v2H7a1 1 0 1 1 0-2h1V2H6Z'
            clipRule='evenodd'
          />
        </svg>
      </div>
      <h2 className='text-xl font-bold text-gray-900 sm:text-3xl dark:text-white'>
        Documents Not Found
      </h2>

      <p className='text-sm text-gray-500 dark:text-gray-400'>
        {activeTab === 'All'
          ? 'No documents match your current filters. Upload your first document or use AI search to find specific content.'
          : `No Documents with status "${activeTab}" found. Upload your first document or use AI search to find specific content.`}
      </p>
      {
        setOpenModal && (
          <button
            className='flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700'
            onClick={() => setOpenModal(true)}
          >
            <span className='text-sm font-medium'>Add Your First Document</span>
          </button>
        )}
    </div>
  );
}
