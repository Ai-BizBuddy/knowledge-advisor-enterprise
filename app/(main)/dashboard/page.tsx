'use client';
import {
  RecentActivityCard,
  RecentKnowledgeBasesCard,
  RecommendedKnowledgeBases,
  StatusCard,
} from '@/components';
import { useLoading } from '@/contexts/LoadingContext';
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
  const statusCards = getStatusCards();
  const recentKnowledgeBasesData = getRecentKnowledgeBasesData();
  const recommendedKnowledgeBasesData = getRecommendedKnowledgeBasesData();

  // Set loading state when data is being fetched
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);
  // Mock data for recent activities (this should come from a service in real app)
  const recentActivities = [
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

  return (
    <div className='min-h-screen'>
      {/* Main Container with consistent responsive padding */}
      <div className='p-4 sm:p-6 lg:p-8'>
        {/* Page Header */}
        <div className='mb-6 sm:mb-8'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900 dark:text-white'>
            Dashboard
          </h1>
          <p className='text-sm text-gray-500 sm:text-base dark:text-gray-400'>
            Monitor your knowledge base performance and activity
          </p>
        </div>

        {/* Status Cards Grid - Responsive layout */}
        <div className='mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2 xl:grid-cols-4'>
          {statusCards.map((card, index) => (
            <StatusCard
              key={index}
              name={card.name}
              value={card.value}
              icon={card.icon}
              color={card.color}
            />
          ))}
        </div>

        {/* Main Content Grid - Responsive layout */}
        {/* set support ipad pro size */}
        <div className='space-y-6 pb-4'>
          <RecentKnowledgeBasesCard items={recentKnowledgeBasesData.items} />
        </div>

        {/* Recommended Knowledge Bases */}
        <div className='flex flex-col gap-6 sm:flex-col sm:flex-wrap md:flex-row md:flex-nowrap lg:flex-row lg:flex-nowrap'>
          <div className='w-full sm:w-1/2'>
            <RecommendedKnowledgeBases
              items={recommendedKnowledgeBasesData.items}
            />
          </div>
          <div className='w-full sm:w-1/2'>
            <RecentActivityCard activities={recentActivities} />
          </div>
        </div>
      </div>
    </div>
  );
}
