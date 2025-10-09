'use client';

/**
 * LogsTable Demo Page
 * 
 * Simple demo page to showcase the LogsTable component functionality
 */

import { LogsTable } from '@/components/logsTable';
import { Card } from 'flowbite-react';
import { useState } from 'react';

export default function LogsTableDemo() {
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className='container mx-auto p-6'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
          Logs Table Demo
        </h1>
        <p className='text-gray-600 dark:text-gray-400'>
          A comprehensive logs table with timestamp, message display, search, and pagination features.
        </p>
      </div>

      <Card>
        <LogsTable
          loading={loading}
          onRefresh={handleRefresh}
          pageSize={5}
          className='w-full'
        />
      </Card>
    </div>
  );
}