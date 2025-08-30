"use client";
import { DeepSearchData } from "@/interfaces/DeepSearchTypes";

interface DocumentPreviewProps {
  document: DeepSearchData;
  isOpen: boolean;
  onClose: () => void;
  isFullScale?: boolean;
  onToggleFullScale?: () => void;
  className?: string;
}

export const DocumentPreview = ({
  document,
  isOpen,
  onClose,
  isFullScale = false,
  onToggleFullScale,
  className = "",
}: DocumentPreviewProps) => {
  if (!isOpen || !document.fileUrl) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleFullScaleToggle = () => {
    if (onToggleFullScale) {
      onToggleFullScale();
    }
  };

  return (
    <div
      className={`bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm ${className}`}
      onClick={handleBackdropClick}
    >
      <div
        className={`relative rounded-lg bg-white shadow-xl dark:bg-gray-800 ${
          isFullScale ? "h-[95vh] w-[95vw]" : "h-[70vh] w-[80vw] max-w-4xl"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">
              {document.name}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="capitalize">{document.fileType}</span>
              <span>•</span>
              <span>{document.fileSize}</span>
              <span>•</span>
              <span>{document.knowledgeName}</span>
            </div>
          </div>

          <div className="ml-4 flex items-center gap-2">
            {/* Toggle Full Scale Button */}
            {onToggleFullScale && (
              <button
                onClick={handleFullScaleToggle}
                className="p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                title={isFullScale ? "Exit full screen" : "Full screen"}
              >
                {isFullScale ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 15v4.5M15 15h4.5M15 15l5.25 5.25"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.75 3.75v4.5M3.75 8.25h4.5M20.25 3.75v4.5M20.25 8.25h-4.5M3.75 20.25v-4.5M3.75 15.75h4.5M20.25 20.25v-4.5M20.25 15.75h-4.5"
                    />
                  </svg>
                )}
              </button>
            )}

            {/* Download Button */}
            <a
              href={document.fileUrl}
              download={document.name}
              className="p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              title="Download document"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              title="Close preview"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-hidden">
          {document.fileType.toLowerCase() === "pdf" ? (
            /* PDF Viewer */
            <iframe
              src={`${document.fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="h-full w-full border-0"
              title={`Preview of ${document.name}`}
              style={{
                height: isFullScale ? "calc(95vh - 80px)" : "calc(70vh - 80px)",
              }}
            />
          ) : document.fileType.toLowerCase().includes("doc") ? (
            /* Office Documents Viewer */
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(document.fileUrl)}`}
              className="h-full w-full border-0"
              title={`Preview of ${document.name}`}
              style={{
                height: isFullScale ? "calc(95vh - 80px)" : "calc(70vh - 80px)",
              }}
            />
          ) : document.fileType.toLowerCase().includes("ppt") ? (
            /* PowerPoint Viewer */
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(document.fileUrl)}`}
              className="h-full w-full border-0"
              title={`Preview of ${document.name}`}
              style={{
                height: isFullScale ? "calc(95vh - 80px)" : "calc(70vh - 80px)",
              }}
            />
          ) : (
            /* Fallback for unsupported file types */
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <svg
                className="mb-4 h-16 w-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                Preview not available
              </h3>
              <p className="mb-4 text-gray-500 dark:text-gray-400">
                This file type ({document.fileType}) cannot be previewed
                directly.
              </p>
              <a
                href={document.fileUrl}
                download={document.name}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download File
              </a>
            </div>
          )}
        </div>

        {/* Loading State */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white opacity-0 transition-opacity duration-300 dark:bg-gray-800"
          id="iframe-loading"
        >
          <div className="flex flex-col items-center">
            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Loading document...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
