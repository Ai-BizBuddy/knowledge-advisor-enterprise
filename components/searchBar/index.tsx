"use client";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (term: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  return (
    <div className="flex w-full items-center gap-4">
      <div className="group relative w-full">
        <svg
          className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400 transition-colors duration-200 group-focus-within:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search documents with AI... (e.g., 'ก่อสร้าง', 'employee policies', 'API documentation')"
          className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pr-32 pl-10 text-gray-900 placeholder-gray-400 transition-all duration-200 hover:border-gray-500 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-wait disabled:opacity-70 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800/70"
        />
        <div className="absolute top-1/2 right-3 -translate-y-1/2 transform text-xs text-gray-500">
          Press Enter to search
        </div>
      </div>
      <button
        className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-70 disabled:hover:bg-blue-600"
        disabled={searchTerm.trim() === ""}
        onClick={() => {
          if (searchTerm.trim() !== "") {
            onSearch(searchTerm);
          }
        }}
      >
        Search
      </button>
    </div>
  );
}
