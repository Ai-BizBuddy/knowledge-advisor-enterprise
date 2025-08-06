interface UploadDocumentProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UploadDocument({
    isOpen,
    onClose,
}: UploadDocumentProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="shadow-2xl w-full max-w-4xl max-h-[90vh] rounded-xl border border-gray-200 bg-white text-gray-900 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-white">
                <div className="mb-4 flex items-start justify-between border-b border-gray-200 dark:border-gray-700">
                    <div className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                            {" "}
                            Upload Document{" "}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Add documents to Document Library
                        </p>
                    </div>
                    <div className="p-6">
                        <button
                            className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-white"
                            onClick={onClose}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Upload Document File area */}
                <div className="p-6">
                    <div className="relative cursor-pointer rounded-2xl border-2 border-dashed  p-8 text-center transition-all duration-300 border-gray-600 hover:border-gray-500  hover:bg-blue-50 dark:hover:bg-gray-800">
                        <div className="space-y-4">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                                <svg
                                    className="h-8 w-8 text-blue-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.5"
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    ></path>
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2 dark:text-white">Upload Documents</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
