interface IActivity {
  title: string;
  timestamp: string;
  description?: string;
}

interface IRecentActivityCardProps {
  activities: IActivity[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export type { IActivity, IRecentActivityCardProps };
