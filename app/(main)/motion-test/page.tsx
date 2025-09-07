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
  {
    title: 'Document "API Guidelines.md" uploaded to Development KB',
    timestamp: '5 hours ago',
    description: 'upload • success',
  },
  {
    title: 'Error processing document "Corrupted File.pdf"',
    timestamp: '1 day ago',
    description: 'error • error',
  },
];

export default function MotionTestPage() {
  const [currentState, setCurrentState] = useState<'loading' | 'error' | 'success' | 'empty'>('loading');
  const [activities, setActivities] = useState(mockActivities);

  // Auto-cycle through states for demonstration
  useEffect(() => {
    const states: ('loading' | 'error' | 'success' | 'empty')[] = ['loading', 'success', 'empty', 'error'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % states.length;
      setCurrentState(states[currentIndex]);
      
      if (states[currentIndex] === 'success') {
        setActivities(mockActivities);
      } else if (states[currentIndex] === 'empty') {
        setActivities([]);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    setCurrentState('loading');
    setTimeout(() => {
      setCurrentState('success');
      setActivities(mockActivities);
    }, 2000);
  };

  return (
    <PageLayout
      title='Motion Animation Test'
      subtitle='Demonstrating all loading states with smooth animations.'
    >
      <Section>
        <div className='mb-6 grid grid-cols-2 gap-4 md:grid-cols-4'>
          <button
            onClick={() => {
              setCurrentState('loading');
              setActivities([]);
            }}
            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              currentState === 'loading'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Loading State
          </button>
          
          <button
            onClick={() => {
              setCurrentState('success');
              setActivities(mockActivities);
            }}
            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              currentState === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Success State
          </button>
          
          <button
            onClick={() => {
              setCurrentState('empty');
              setActivities([]);
            }}
            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              currentState === 'empty'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Empty State
          </button>
          
          <button
            onClick={() => {
              setCurrentState('error');
              setActivities([]);
            }}
            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              currentState === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Error State
          </button>
        </div>
        
        <div className='mb-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-800'>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            <strong>Current State:</strong> {currentState.charAt(0).toUpperCase() + currentState.slice(1)}
          </p>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            <strong>Activities Count:</strong> {activities.length}
          </p>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Auto-cycling through states every 4 seconds. Use buttons above to manually control.
          </p>
        </div>
      </Section>

      <RecentActivityCard
        activities={activities}
        loading={currentState === 'loading'}
        error={currentState === 'error' ? 'Network connection failed. Please check your internet connection.' : null}
        onRetry={handleRetry}
      />
    </PageLayout>
  );
}
