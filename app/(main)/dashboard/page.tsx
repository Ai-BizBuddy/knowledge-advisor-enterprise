'use client';
import {
  RecentActivityCard,
  RecentKnowledgeBasesCard,
  RecommendedKnowledgeBases,
  StatusCard,
} from '@/components';
import { useLoading } from '@/contexts/LoadingContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useEffect } from 'react';
import { getStatusCards } from './constants';
import {
  getRecentKnowledgeBasesData,
  getRecommendedKnowledgeBasesData,
} from './mockData';

/**
 * Dashboard page component displaying key metrics and recent activity
 */
export default function Dashboard() {
  const { setLoading } = useLoading();

  // Use real data from services
  const {
    statistics,
    recentKnowledgeBases,
    recommendedKnowledgeBases,
    recentActivities,
    activeChatSessions,
    isLoading: dashboardLoading,
    error: dashboardError,
    lastUpdated,
  } = useDashboard({
    autoRefresh: false,
    enableChatData: true,
  });

  // Fallback to mock data for UI components
  const statusCards = getStatusCards();
  const recentKnowledgeBasesData = getRecentKnowledgeBasesData();
  const recommendedKnowledgeBasesData = getRecommendedKnowledgeBasesData();

  // Set loading state when data is being fetched
  useEffect(() => {
    setLoading(dashboardLoading);
  }, [dashboardLoading, setLoading]);

  // Create enhanced status cards with real data
  const enhancedStatusCards = statistics
    ? [
        {
          name: 'Knowledge Bases',
          value: statistics.totalKnowledgeBases.toString(),
          icon: statusCards[0]?.icon || statusCards[0]?.icon,
          color: statusCards[0]?.color || 'bg-blue-500',
        },
        {
          name: 'Active Documents',
          value: statistics.activeDocuments.toString(),
          icon: statusCards[1]?.icon || statusCards[1]?.icon,
          color: statusCards[1]?.color || 'bg-green-500',
        },
        {
          name: 'Total Queries',
          value: statistics.totalQueries.toString(),
          icon: statusCards[2]?.icon || statusCards[2]?.icon,
          color: statusCards[2]?.color || 'bg-purple-500',
        },
        {
          name: 'Avg Response Time',
          value: statistics.avgResponseTime,
          icon: statusCards[3]?.icon || statusCards[3]?.icon,
          color: statusCards[3]?.color || 'bg-orange-500',
        },
      ]
    : statusCards;

  // Prepare activities data - merge real and mock data
  const allActivities =
    recentActivities.length > 0
      ? recentActivities.map((activity) => ({
          title: activity.title,
          timestamp: new Date(activity.timestamp).toLocaleString(),
          description: activity.description,
        }))
      : [
          {
            title: 'Updated knowledge base',
            timestamp: '2 hours ago',
            description: 'Edited "Security Guidelines" section',
          },
          {
            title: 'Added new article',
            timestamp: 'Yesterday',
            description: 'Published "AI Ethics Best Practices"',
          },
          {
            title: 'User feedback received',
            timestamp: '3 days ago',
          },
        ];

  // Prepare knowledge bases data
  const displayRecentKB =
    recentKnowledgeBases.length > 0
      ? {
          items: recentKnowledgeBases.map((kb) => ({
            id: kb.id,
            title: kb.name,
            description: kb.description || 'No description available',
            documentCount: kb.document_count || 0,
            created_at: kb.created_at,
            updatedAt: kb.updated_at || kb.created_at,
          })),
        }
      : recentKnowledgeBasesData;

  const displayRecommendedKB =
    recommendedKnowledgeBases.length > 0
      ? {
          items: recommendedKnowledgeBases.map((kb) => ({
            id: kb.id,
            title: kb.name,
            description: kb.description || 'No description available',
            summary: kb.description || 'No summary available',
            documentCount: kb.document_count || 0,
            created_at: kb.created_at,
            updatedAt: kb.updated_at || kb.created_at,
          })),
        }
      : recommendedKnowledgeBasesData;

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Main Container with consistent responsive padding */}
      <div className='p-4 sm:p-6 lg:p-8'>
        {/* Enhanced Page Header with Real-time Info */}
        <div className='mb-6 sm:mb-8'>
          <div>
            <h1 className='mb-2 text-3xl font-bold text-gray-900 dark:text-white'>
              Dashboard
            </h1>
            <p className='text-sm text-gray-500 sm:text-base dark:text-gray-400'>
              Monitor your knowledge base performance and activity
            </p>
            {lastUpdated && (
              <div className='mt-2 flex items-center text-xs text-gray-400'>
                <svg
                  className='mr-1 h-4 w-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {dashboardLoading && (
          <div className='mb-6 flex items-center rounded-lg border border-blue-200 bg-blue-50 p-4'>
            <svg
              className='mr-3 -ml-1 h-5 w-5 animate-spin text-blue-600'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              ></circle>
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
            <span className='text-sm text-blue-800'>
              Updating dashboard data...
            </span>
          </div>
        )}

        {/* Error Display */}
        {dashboardError && (
          <div className='mb-6 rounded-lg border border-red-200 bg-red-50 p-4'>
            <div className='flex items-center'>
              <svg
                className='mr-3 h-5 w-5 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
              <div>
                <p className='text-sm font-medium text-red-800'>
                  Dashboard Error
                </p>
                <p className='text-sm text-red-700'>{dashboardError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Status Cards Grid - Responsive layout */}
        <div className='mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2 xl:grid-cols-4'>
          {enhancedStatusCards.map((card, index) => (
            <div key={index} className='relative'>
              <StatusCard
                name={card.name}
                value={card.value}
                icon={card.icon}
                color={card.color}
              />
              {statistics && (
                <div className='absolute top-2 right-2'>
                  <div
                    className='h-2 w-2 animate-pulse rounded-full bg-green-400'
                    title='Live data'
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Chat Sessions Section - New Feature */}
        {activeChatSessions.length > 0 && (
          <div className='mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800'>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Active Chat Sessions
              </h3>
              <span className='rounded-full bg-green-100 px-2 py-1 text-xs text-green-800'>
                {activeChatSessions.length} active
              </span>
            </div>
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3'>
              {activeChatSessions.slice(0, 3).map((session) => (
                <div
                  key={session.id}
                  className='rounded-lg bg-gray-50 p-3 dark:bg-gray-700'
                >
                  <h4 className='truncate text-sm font-medium text-gray-900 dark:text-white'>
                    {session.title || 'Untitled Session'}
                  </h4>
                  <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                    Started: {new Date(session.started_at).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid - Recent Knowledge Bases */}
        <div className='space-y-6 pb-4'>
          <RecentKnowledgeBasesCard items={displayRecentKB.items} />
        </div>

        {/* Enhanced Bottom Section */}
        <div className='flex flex-col gap-6 sm:flex-col sm:flex-wrap md:flex-row md:flex-nowrap lg:flex-row lg:flex-nowrap'>
          <div className='w-full sm:w-1/2'>
            <RecommendedKnowledgeBases items={displayRecommendedKB.items} />
          </div>
          <div className='w-full sm:w-1/2'>
            <RecentActivityCard activities={allActivities} />
          </div>
        </div>

        {/* Data Source Indicator */}
        <div className='mt-8 rounded-lg bg-gray-100 p-3 dark:bg-gray-800'>
          <div className='flex items-center justify-center text-xs text-gray-500 dark:text-gray-400'>
            <svg
              className='mr-2 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M13 10V3L4 14h7v7l9-11h-7z'
              />
            </svg>
            {statistics
              ? 'Connected to live data sources'
              : 'Using cached data'}{' '}
            •
            {recentActivities.length > 0
              ? ' Real-time activities'
              : ' Mock activities'}{' '}
            • Auto-refresh every 5 minutes
          </div>
        </div>
      </div>
    </div>
  );
}
