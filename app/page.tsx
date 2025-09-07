'use client';

import { useAuthContext } from '@/contexts/AuthContext';
import LoadingPage from './loading';
import LoginPage from './login/page';

export default function Home() {
  const { loading } = useAuthContext();

  return (
    <main className='min-h-screen'>
      {loading ? <LoadingPage /> : <LoginPage />}
    </main>
  );
}
