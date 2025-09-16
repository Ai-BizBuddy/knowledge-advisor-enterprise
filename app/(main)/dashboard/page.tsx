'use client';

import {
  RecentActivityCard,
  StatusCard
} from '@/components';
import { PageLayout, Section } from '@/components/layouts';
import { useDashboard } from '@/hooks/useDashboard';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useMemo } from 'react';

// Removed legacy KPI types in favor of shared StatusCard tiles

export default function DashboardPage() {
  // Data hooks
  const { statistics } =
    useDashboard({
      autoRefresh: true,
      enableChatData: false,
    });
  const { 
    activities: recentActivities, 
    loading: activitiesLoading, 
    error: activitiesError,
    refresh: refreshActivities 
  } = useRecentActivity({
    limit: 10,
    autoRefresh: true,
    refreshInterval: 60000,
  });

  // Map to RecentActivityCard props
  const cardActivities = useMemo(
    () => {
      const mapped = (recentActivities || []).map((a) => ({
        title: a.message,
        timestamp: a.time,
        description: `${a.type} • ${a.status}`,
      }));
      
      return mapped;
    },
    [recentActivities],
  );

  return (
    <PageLayout
      title='Dashboard'
      subtitle='Overview of your knowledge bases, documents, and activity.'
    >
      <Section>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <StatusCard
            name='Knowledge Bases'
            value={(statistics?.totalKnowledgeBases ?? 0).toLocaleString()}
            color='bg-indigo-500/10 text-indigo-400'
            icon={
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
              >
                <path d='M4 6.75A2.75 2.75 0 0 1 6.75 4h10.5A2.75 2.75 0 0 1 20 6.75v10.5A2.75 2.75 0 0 1 17.25 20H6.75A2.75 2.75 0 0 1 4 17.25V6.75Z' />
              </svg>
            }
          />
          <StatusCard
            name='Documents'
            value={(
              statistics?.totalDocuments ??
              statistics?.activeDocuments ??
              0
            ).toLocaleString()}
            color='bg-emerald-500/10 text-emerald-400'
            icon={
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
              >
                <path d='M6 2a2 2 0 0 0-2 2v16l6-3 6 3V4a2 2 0 0 0-2-2H6z' />
              </svg>
            }
          />
          <StatusCard
            name='Chunks'
            value={(statistics?.totalChunks ?? 0).toLocaleString()}
            color='bg-sky-500/10 text-sky-400'
            icon={
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
              >
                <path d='M3 5h8v6H3V5zm10 0h8v6h-8V5zM3 13h8v6H3v-6zm10 0h8v6h-8v-6z' />
              </svg>
            }
          />
          <StatusCard
            name='Disk Usage'
            value={statistics?.totalStorageFormatted ?? '0 B'}
            color='bg-violet-500/10 text-violet-400'
            icon={
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='currentColor'
              >
                <path d='M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 10.5V7a1 1 0 0 0-2 0v6a1 1 0 0 0 .553.894l3 1.5a1 1 0 1 0 .894-1.788Z' />
              </svg>
            }
          />
        </div>
      </Section>
      <RecentActivityCard 
        activities={cardActivities} 
        loading={activitiesLoading}
        error={activitiesError}
        onRetry={refreshActivities}
      />
    </PageLayout>
  );
}
