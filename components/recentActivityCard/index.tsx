import { IRecentActivityCardProps } from '@/interfaces/RecentActivityCard'
import { Card } from 'flowbite-react'

export default function RecentActivityCard({ activities }: IRecentActivityCardProps) {
    return (
        <Card className="w-full h-full dark:bg-gray-900">
            <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Recent Activity
            </h5>

            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {activities.map((activity, index) => (
                    <li key={index} className="py-4 flex gap-3 items-start">
                        <svg className="w-6 h-6 text-blue-500 mt-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586V8Z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {activity.title}
                            </p>
                            {activity.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {activity.description}
                                </p>
                            )}
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                {activity.timestamp}
                            </span>
                        </div>
                    </li>
                ))}
            </ul>
        </Card>
    )
}
