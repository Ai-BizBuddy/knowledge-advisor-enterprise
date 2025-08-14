"use client";
import { LoadingPage, SlideBar } from "@/components";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth, usePermissions } from "@/hooks";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLoading } from "@/contexts/LoadingContext";

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

  // Filter navigation items based on permissions

  const handleLogout = async () => {
    await logout();
    // Use setTimeout to avoid hydration mismatch
    setTimeout(() => {
      window.location.href = "/login";
    }, 0);
  };

  useEffect(() => {
    // Auth context will handle redirects automatically
    // This is just for backward compatibility
    const checkAuth = async () => {
      if (!authLoading && !user && pathname !== "/login") {
        // Use setTimeout to avoid hydration mismatch
        setTimeout(() => {
          window.location.href = "/login";
        }, 0);
      }
    };
    checkAuth();
  }, [user, authLoading, pathname]);

  // Close mobile menu when route changes

  return (
    <>
      <LoadingPage />
      <SlideBar
        onNavigate={() => {
          setLoading(true);
        }}
        handleLogout={handleLogout}
      >
        {children}
      </SlideBar>
    </>
  );
}
