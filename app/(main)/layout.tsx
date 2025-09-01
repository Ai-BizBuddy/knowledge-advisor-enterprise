'use client';
import { SlideBar } from '@/components';
import { useAuthContext } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { useAuth } from '@/hooks';
import { createClient } from '@/utils/supabase/client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user, loading: authLoading } = useAuthContext();
  // const { hasFeatureAccess } = usePermissions();
  const { setLoading } = useLoading();

  const handleLogout = async () => {
    await logout();
    setTimeout(() => {
      window.location.href = '/login';
    }, 0);
  };

  const getURL = async () => {
    const supabase = createClient();
    // const { data, error } = await supabase.storage
    //   .from('58872719-ddc0-42dd-a939-3efecbcf9657')
    //   .createSignedUrl('documents/3dd67bbc-7b29-44d1-968d-66e212ff6933', 60);
    const { data, error } = await supabase.storage
      .from('58872719-ddc0-42dd-a939-3efecbcf9657')
      .list('documents', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });
    console.log('Documents:', data);
    if (error) {
      console.error('Error creating signed URL:', error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!authLoading && !user && pathname !== '/login') {
        await getURL();
        // setTimeout(() => {
        //   window.location.href = '/login';
        // }, 0);
      }
    };
    checkAuth();
  }, [user, authLoading, pathname]);

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
