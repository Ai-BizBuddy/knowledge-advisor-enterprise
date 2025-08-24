interface ChatHistoryProps {
  title: string;
  dateTime: string;
  messageCount: number;
  size: string;
  tags: string[];
  onDelete: () => void;
  onExport: () => void;
  onClick?: () => void;
}

export type { ChatHistoryProps };
