import React, { useState } from "react";
interface DataTableProps<T extends Record<string, unknown>> {
  columns: { key: string; label: string }[];
  data: T[];
  pageSize?: number;
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize = 10,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = data.slice((page - 1) * pageSize, page * pageSize);

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full rounded-lg border border-gray-200 text-left text-sm text-gray-500 rtl:text-right dark:border-gray-700 dark:text-gray-400">
        <thead className="bg-gray-50 text-xs text-gray-700 uppercase dark:bg-gray-700 dark:text-gray-400">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className="px-6 py-3">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 text-center">
                No data
              </td>
            </tr>
          ) : (
            paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4">
                    {row[col.key] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between pt-4"
          aria-label="Table navigation"
        >
          <ul className="inline-flex h-8 -space-x-px text-sm">
            <li>
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className={`ms-0 flex h-8 items-center justify-center rounded-s-lg border border-e-0 border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${page === 1 ? "cursor-not-allowed opacity-50" : ""}`}
              >
                Previous
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <li key={p}>
                <button
                  onClick={() => goToPage(p)}
                  className={`flex h-8 items-center justify-center border border-gray-300 px-3 leading-tight hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${p === page ? "bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-white" : "bg-white text-gray-500"}`}
                >
                  {p}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className={`flex h-8 items-center justify-center rounded-e-lg border border-gray-300 bg-white px-3 leading-tight text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white ${page === totalPages ? "cursor-not-allowed opacity-50" : ""}`}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default DataTable;
