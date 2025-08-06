import { IProps } from '@/interfaces/RecommendedKnowledgeBases'
import { Card } from 'flowbite-react'

export function RecommendedKnowledgeBases({ items }: IProps) {
    return (
        <Card className="w-full dark:bg-gray-900">
            <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-yellow-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M7.05 4.05A7 7 0 0 1 19 9c0 2.407-1.197 3.874-2.186 5.084l-.04.048C15.77 15.362 15 16.34 15 18a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1c0-1.612-.77-2.613-1.78-3.875l-.045-.056C6.193 12.842 5 11.352 5 9a7 7 0 0 1 2.05-4.95ZM9 21a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2h-4a1 1 0 0 1-1-1Zm1.586-13.414A2 2 0 0 1 12 7a1 1 0 1 0 0-2 4 4 0 0 0-4 4 1 1 0 0 0 2 0 2 2 0 0 1 .586-1.414Z" clipRule="evenodd" />
                </svg>
                AI Suggestions
            </h5>

            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item, index) => (
                    <li key={index} className="py-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {item.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {item.summary}
                        </p>
                        {item.confidenceScore !== undefined && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                Confidence: {item.confidenceScore}%
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </Card>
    )
}
