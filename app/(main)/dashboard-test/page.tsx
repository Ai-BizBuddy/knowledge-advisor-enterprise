'use client';

import { RecentActivityCard } from '@/components';
import { PageLayout, Section } from '@/components/layouts';
import { useEffect, useState } from 'react';

// Mock data for testing loading states
const mockActivities = [
  {
    title: 'Document "Financial Report Q3.pdf" uploaded to Acme Corp KB',
    timestamp: '2 minutes ago',
    description: 'upload • success',
  },
  {
    title: 'Knowledge base "Tech Documentation" created',
    timestamp: '1 hour ago',
    description: 'knowledgebase • info',
  },
  {
    title: 'Processing document "User Manual.docx" in Marketing KB',
    timestamp: '3 hours ago',
    description: 'processing • info',
  },
];

export default function DashboardTestPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);

  // Simulate loading states
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setError(null);
    setShowError(false);
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const simulateError = () => {
    setError('Failed to load activities. Network connection error.');
    setShowError(true);
    setLoading(false);
  };

  const simulateSuccess = () => {
    setError(null);
    setShowError(false);
    setLoading(false);
  };

  return (
    <PageLayout
      title='Dashboard Test - Loading States'
      subtitle='Test different loading states for the Recent Activity component.'
    >
      <Section>
        <div className='mb-6 flex gap-4'>
          <button
            onClick={() => setLoading(true)}
            className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'
          >
            Show Loading
          </button>
          <button
            onClick={simulateError}
            className='rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700'
          >
            Show Error
          </button>
          <button
            onClick={simulateSuccess}
            className='rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700'
          >
            Show Success
          </button>
          <button
            onClick={() => {
              setError(null);
              setShowError(false);
              setLoading(false);
            }}
            className='rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700'
          >
            Show Empty
          </button>
        </div>
      </Section>

      <RecentActivityCard
        activities={showError ? [] : mockActivities}
        loading={loading}
        error={showError ? error : null}
        onRetry={handleRetry}
      />
    </PageLayout>
  );
}
