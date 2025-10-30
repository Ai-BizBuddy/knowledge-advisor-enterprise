import { ReactNode } from 'react';

/**
 * Navigation menu item interface
 */
export interface NavigationMenuItem {
  name: string;
  url: string;
  icon: ReactNode;
  active: boolean;
  requiredPermissions?: string[];
  requiredRoles?: string[];
}

/**
 * SlideBar component props interface
 */
export interface SlideBarProps {
  children: ReactNode;
  onNavigate?: () => void;
  handleLogout?: () => void;
}

/**
 * User dropdown menu item interface
 */
export interface UserMenuItem {
  label: string;
  href: string;
  onClick?: () => void;
}
