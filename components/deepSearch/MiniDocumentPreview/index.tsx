"use client";
import { DeepSearchData } from "@/interfaces/DeepSearchTypes";

interface MiniDocumentPreviewProps {
  document: DeepSearchData;
  isOpen: boolean;
  onClose: () => void;
  onExpandToFullScale: () => void;
  className?: string;
}

export const MiniDocumentPreview = ({
  document,
  isOpen,
  onClose,
  onExpandToFullScale,
  className = "",
}: MiniDocumentPreviewProps) => {
  if (!isOpen || !document.fileUrl) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`bg-opacity-30 fixed inset-0 z-40 flex items-center justify-center bg-black backdrop-blur-sm ${className}`}
      onClick={handleBackdropClick}
    >
      <div
        className="relative h-[50vh] w-[60vw] max-w-2xl rounded-lg bg-white shadow-xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-3 dark:border-gray-700">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-medium text-gray-900 dark:text-gray-100">
              {document.name}
            </h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="capitalize">{document.fileType}</span>
              <span>•</span>
              <span>{document.fileSize}</span>
            </div>
          </div>

          <div className="ml-3 flex items-center gap-1">
            {/* Expand Button */}
            <button
              onClick={onExpandToFullScale}
              className="p-1.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              title="Open full preview"
            >
              <svg
                className="h-4 w-4"
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
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
              title="Close preview"
            >
              <svg
                className="h-4 w-4"
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

        {/* Document Content - Mini Preview */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className="h-full w-full cursor-pointer"
            onClick={onExpandToFullScale}
            title="Click to open full preview"
          >
            {document.fileType.toLowerCase() === "pdf" ? (
              /* PDF Mini Viewer */
              <iframe
                src={`${document.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&zoom=75`}
                className="pointer-events-none h-full w-full border-0"
                title={`Mini preview of ${document.name}`}
                style={{ height: "calc(50vh - 60px)" }}
              />
            ) : document.fileType.toLowerCase().includes("doc") ||
              document.fileType.toLowerCase().includes("ppt") ? (
              /* Office Documents Mini Viewer */
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(document.fileUrl)}&wdStartOn=1`}
                className="pointer-events-none h-full w-full border-0"
                title={`Mini preview of ${document.name}`}
                style={{ height: "calc(50vh - 60px)" }}
              />
            ) : (
              /* Fallback for unsupported file types */
              <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                <svg
                  className="mb-3 h-12 w-12 text-gray-400"
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
                <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                  Preview not available
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Click to download
                </p>
              </div>
            )}
          </div>

          {/* Overlay to indicate clickable area */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-200 hover:opacity-100">
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 transform">
              <div className="rounded bg-black/70 px-2 py-1 text-xs text-white">
                Click to expand
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniDocumentPreview;
