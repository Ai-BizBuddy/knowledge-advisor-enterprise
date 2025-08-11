"use client";

interface TabsProps {
  currentTab: string;
  tabList: string[];
  onTabChange: (tab: string) => void;
}

/**
 * Tabs component for switching between different views
 */
export default function Tabs({ currentTab, tabList, onTabChange }: TabsProps) {
  return (
    <div className="flex justify-start text-sm font-medium text-gray-500 dark:text-gray-400">
      {tabList.map((tab, index) => (
        <button
          key={index}
          onClick={() => onTabChange(tab)}
          className={`inline-block rounded-lg p-4 hover:bg-gray-200 dark:hover:bg-gray-500 ${
            currentTab === tab ? "text-blue-600 dark:text-blue-500" : ""
          }`}
          aria-current={currentTab === tab ? "page" : undefined}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
