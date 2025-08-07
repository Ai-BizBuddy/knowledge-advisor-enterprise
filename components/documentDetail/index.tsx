import { Badge } from "flowbite-react";

interface Document {
  name: string;
  size: string;
  type: string;
  date: string;
  project?: string[];
  source?: string;
  status: string;
  uploadedBy: string;
  avatar: string;
  uploadDate?: string;
}

export default function DocumentDetail({
  name,
  size,
  type,
  project,
  date,
  source,
  uploadedBy,
  uploadDate,
}: Document) {
  return (
    <div className="h-full">
      {/* Document Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {name}
        </h2>
        <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
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
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {size} • {type}
        </p>
      </div>

      {/* Document Details */}
      <div className="space-y-4 text-sm">
        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Created by:
            </p>
            <p className="text-gray-900 dark:text-white">{uploadedBy}</p>
          </div>
        </div>

        {project && project.length > 0 && (
          <div className="flex items-start gap-3">
            <svg
              className="mt-0.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1v1H9V7zm5 0h1v1h-1V7zm-5 4h1v1H9v-1zm5 0h1v1h-1v-1zm-3 4h2a1 1 0 011 1v4h-4v-4a1 1 0 011-1z"
              />
            </svg>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Project:
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {project.map((p, index) => (
                  <Badge key={index} color="blue" size="sm">
                    #{p}
                  </Badge>
                ))}
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  in Apollo
                </span>
              </div>
            </div>
          </div>
        )}

        {source && (
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                Source:
              </p>
              <Badge color="gray" size="sm">
                {source}
              </Badge>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Uploaded:
            </p>
            <p className="text-gray-900 dark:text-white">
              {uploadDate || date}
            </p>
          </div>
        </div>
      </div>

      {/* Document Preview */}
      <div className="mt-8">
        <h3 className="mb-4 font-semibold text-gray-800 dark:text-gray-200">
          Document Preview
        </h3>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-600 dark:bg-gray-800">
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4">
              <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                <svg
                  className="mr-2 inline h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Expand Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
