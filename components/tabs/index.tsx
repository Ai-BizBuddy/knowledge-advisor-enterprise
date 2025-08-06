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
        <div className="text-sm font-medium text-center text-gray-500 dark:text-gray-400">
            {tabList.map((tab, index) => (
                <button
                    key={index}
                    onClick={() => onTabChange(tab)}
                    className={`inline-block p-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 dark:hover:text-gray-300 ${currentTab === tab
                            ? "text-blue-600 dark:text-blue-500"
                            : ""
                        }`}
                    aria-current={currentTab === tab ? "page" : undefined}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}