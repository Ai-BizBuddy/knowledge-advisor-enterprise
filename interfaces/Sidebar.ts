import { ReactNode } from 'react';

interface NavigationItem {
  href: string;
  label: string;
  icon: string;
  requiredFeature?: string;
  requiredPermissions?: string[];
}

export interface SidebarLayoutProps {
  children: ReactNode;
  pathname: string;
  filteredNavigationItems: NavigationItem[];
  handleLogout: () => void;
  handleMobileToggle: (mobileOpen: boolean) => void;
  mobileOpen?: boolean;
}
