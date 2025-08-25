export interface LoadingCardProps {
  /**
   * Number of loading cards to render
   * @default 6
   */
  count?: number;

  /**
   * Layout variant for the loading cards
   * @default 'grid'
   */
  variant?: 'grid' | 'list' | 'compact';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Loading message to display
   * @default 'Loading...'
   */
  message?: string;

  /**
   * Whether to show the loading message
   * @default true
   */
  showMessage?: boolean;
}
