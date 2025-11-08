import { ReactNode } from 'react';

export interface PageGuardProps {
  /**
   * Required permissions to access the page
   * If empty array, page is accessible to all authenticated users
   */
  requiredPermissions?: string[];
  
  /**
   * Whether user needs ALL permissions or just ANY of them
   * @default 'any'
   */
  requirementType?: 'any' | 'all';
  
  /**
   * Custom message to display when access is denied
   */
  deniedMessage?: string;
  
  /**
   * Custom title for access denied state
   */
  deniedTitle?: string;
  
  /**
   * Route to redirect when access is denied
   * If not provided, shows AccessDenied component
   */
  redirectTo?: string;
  
  /**
   * Show loading state while checking permissions
   * @default true
   */
  showLoading?: boolean;
  
  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode;
  
  /**
   * Children to render when access is granted
   */
  children: ReactNode;
  
  /**
   * Additional className for the container
   */
  className?: string;
}
