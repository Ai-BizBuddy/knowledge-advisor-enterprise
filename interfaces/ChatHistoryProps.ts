interface ChatHistoryProps {
  title: string;
  dateTime: string;
  messageCount: number;
  size: string;
  tags: string[];
  onDelete: () => void;
  onExport: () => void;
}

export type { ChatHistoryProps };
