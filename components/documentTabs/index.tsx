import Tabs from "../tabs";

interface DocumentTabsProps {
  search: string;
  setSearch: (value: string) => void;
  activeTab: string;
  setActiveTab: (value: string) => void;
}
export default function DocumentsTabs({
  search,
  setSearch,
  activeTab,
  setActiveTab,
}: DocumentTabsProps) {
  const tabs = ["All", "Processed", "Processing", "Failed"];
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <div className="w-fit">
        <Tabs
          currentTab={activeTab}
          tabList={tabs}
          onTabChange={setActiveTab}
        />
      </div>

      <div className="group relative w-1/3">
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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents with AI... (e.g., 'ก่อสร้าง', 'employee policies', 'API documentation')"
          className="w-full rounded-xl border border-gray-300 bg-gray-50 py-3 pr-6 pl-10 text-gray-900 placeholder-gray-400 transition-all duration-200 hover:border-gray-500 focus:border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-wait disabled:opacity-70 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:bg-gray-800/70"
        />
      </div>
    </div>
  );
}
