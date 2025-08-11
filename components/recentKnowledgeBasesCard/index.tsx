import { IRecentKnowledgeBasesCardProps } from "@/interfaces/RecentKnowledgeBasesCard";
import { Card } from "flowbite-react";

export default function RecentKnowledgeBasesCard({
  items,
}: IRecentKnowledgeBasesCardProps) {
  return (
    <Card className="h-full w-full dark:bg-gray-900">
      <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
        Recent Knowledge Bases
      </h5>

      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3 py-4">
            <svg
              className="mt-1 h-6 w-6 text-green-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                fillRule="evenodd"
                d="M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-7Z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {item.title}
              </p>
              {item.summary && (
                <p className="line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                  {item.summary}
                </p>
              )}
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Last updated: {item.updatedAt}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
