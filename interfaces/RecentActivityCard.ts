interface IActivity {
  title: string;
  timestamp: string;
  description?: string;
}

interface IRecentActivityCardProps {
  activities: IActivity[];
}

export type { IActivity, IRecentActivityCardProps };
