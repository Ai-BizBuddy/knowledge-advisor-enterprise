import { Document } from "@/data/documentsData";
import { getFileIcon } from "@/utils/documentsUtils";

interface DocumentsTableProps {
  documents: Document[];
  selectedDocuments: number[];
  selectedDocument: number;
  startIndex: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
  onSelectAll: () => void;
  onSelectDocument: (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  onDocumentClick: (index: number) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

export const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  selectedDocuments,
  selectedDocument,
  startIndex,
  sortBy,
  sortOrder,
  onSort,
  onSelectAll,
  onSelectDocument,
  onDocumentClick,
  isAllSelected,
  isIndeterminate,
}) => {
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;

    return (
      <svg
        className={`h-4 w-4 ${sortOrder === "asc" ? "" : "rotate-180"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  const SortableHeader = ({
    column,
    children,
  }: {
    column: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300"
    >
      {children}
      {getSortIcon(column)}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={onSelectAll}
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
              <SortableHeader column="Name">Name</SortableHeader>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
              <SortableHeader column="Date">Date</SortableHeader>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
              <SortableHeader column="Uploaded By">Uploaded By</SortableHeader>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
          {documents.map((doc, pageIndex) => {
            const actualIndex = startIndex + pageIndex;
            const isSelected = selectedDocuments.includes(actualIndex);
            const isCurrentDocument = selectedDocument === actualIndex;

            return (
              <tr
                key={actualIndex}
                onClick={() => onDocumentClick(actualIndex)}
                className={`cursor-pointer transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  isCurrentDocument ? "bg-blue-50 dark:bg-blue-900/20" : ""
                } ${
                  isSelected
                    ? "bg-blue-25 border-l-4 border-blue-500 dark:border-blue-400 dark:bg-blue-900/10"
                    : ""
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={isSelected}
                    onChange={(e) => onSelectDocument(pageIndex, e)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="mr-3 text-2xl">{getFileIcon(doc.type)}</div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {doc.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.size} • {doc.type}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                  {doc.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-700">
                      {doc.uploadedBy
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="ml-3 text-sm text-gray-900 dark:text-white">
                      {doc.uploadedBy}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
