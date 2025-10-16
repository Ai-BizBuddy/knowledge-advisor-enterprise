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
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  showPagination?: boolean;
}

export type { IActivity, IRecentActivityCardProps };
