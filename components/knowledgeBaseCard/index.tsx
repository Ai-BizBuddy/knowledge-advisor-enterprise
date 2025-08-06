

/**
 * Props interface for KnowledgeBaseCard component
 */
interface KnowledgeBaseCardProps {
    title: string;
    detail: string;
    updated: string;
    onDelete?: () => void; // Made optional since it's not used
    onDetail: () => void;
}

/**
 * KnowledgeBaseCard component displays a knowledge base item with title, detail, and update time
 * Provides delete and detail view functionality through callback props
 */
export default function KnowledgeBaseCard({
    title,
    detail,
    updated,
    onDelete, // Optional delete function
    onDetail
}: KnowledgeBaseCardProps) {
    return (
        <div
            className="group cursor-pointer h-fit w-80 shadow flex flex-col gap-4 items-left bg-gray-100 dark:bg-gray-900 border-gray-700/50 rounded-2xl p-6 transition-all duration-300 ease-in-out transform hover:scale-101 hover:shadow-2xl"
            onClick={onDetail}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onDetail();
                }
            }}
        >
            <div className="title flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <div className="w-40">

                    <h2 className="text-lg font-bold tracking-tight sm:text-2xl card-title text-gray-900 dark:text-white">
                        {title}
                    </h2>
                </div>
                <div className="flex justify-end w-24">
                    <button
                        className="p-2 hidden group-hover:block rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering onDetail
                            if (onDelete) {
                                onDelete();
                            }
                        }}
                        title="Delete Knowledge Base"
                    >
                        <svg className="w-4 h-4 text-red-500 dark:text-red-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M8.586 2.586A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2h3a1 1 0 1 1 0 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a1 1 0 0 1 0-2h3V4a2 2 0 0 1 .586-1.414ZM10 6h4V4h-4v2Zm1 4a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Zm4 0a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Z" clipRule="evenodd" />
                        </svg>

                    </button>
                </div>
            </div>
            <div className="detail">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {detail}
                </p>
            </div>
            <div className="updated flex items-center gap-2">
                <div>
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <div className="flex w-40 justify-start">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {updated}
                    </span>
                </div>
                <div className="flex w-48 justify-end hidden group-hover:flex">
                    <span className="text-sm text-blue-500 dark:text-blue-400 transition-colors duration-300 group-hover:text-blue-700 dark:group-hover:text-blue-300"> View Details {'>'} </span>
                </div>
            </div>
        </div>
    );
}