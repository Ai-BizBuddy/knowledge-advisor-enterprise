import React from "react";

interface SearchFilter {
  id: string;
  label: string;
  color: string;
}

interface SearchFiltersProps {
  filters: SearchFilter[];
  selectedFilters: string[];
  onToggleFilter: (filterId: string) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  selectedFilters,
  onToggleFilter,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Filter by:
      </span>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onToggleFilter(filter.id)}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            selectedFilters.includes(filter.id)
              ? `bg-${filter.color}-100 text-${filter.color}-800 border-${filter.color}-200 dark:bg-${filter.color}-900 dark:text-${filter.color}-200`
              : "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};
