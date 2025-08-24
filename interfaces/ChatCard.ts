interface IChatCardProps {
  avatar?: string;
  name: string;
  time?: string;
  message: string;
  status?: string;
  isUser?: boolean; // ถ้า true แสดงฝั่งขวา
}

export type { IChatCardProps };
