export interface IStatusCardProps {
  name: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  error?: boolean;
  loading?: boolean;
}
