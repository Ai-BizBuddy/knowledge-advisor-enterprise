'use client';
import { SlideBar } from '@/components';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useAuth } from '@/hooks';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout, getSession } = useAuth();
  const { user, loading: authLoading } = useAuthContext();
  const { setLoading } = useLoading();

  const handleLogout = async () => {
    await logout();
    setTimeout(() => {
      window.location.href = '/login';
    }, 0);
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!authLoading && !user && pathname !== '/login') {
        setTimeout(() => {
          window.location.href = '/login';
        }, 0);
      }
    };
    checkAuth();
  }, [user, authLoading, pathname, getSession]);

  return (
    <>
      <SlideBar
        onNavigate={() => {
          setLoading(false);
        }}
        handleLogout={handleLogout}
      >
        {children}
      </SlideBar>
    </>
  );
}
