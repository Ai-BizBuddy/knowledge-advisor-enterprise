'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingPage from './loading';

export default function Home() {
  const { session, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect while auth is still loading
    if (loading) return;

    // If no session exists, redirect to login
    if (!session) {
      router.push('/login');
      return;
    }

    // If session exists, redirect to dashboard
    router.push('/dashboard');
  }, [session, loading, router]);

  // Show loading while checking session or during redirect
  return (
    <main className='min-h-screen'>
      <LoadingPage /> 
    </main>
  );
}
