
export interface Document {
  name: string;
  size: string;
  type: string;
  date: string;
  status: string; // Keep as string for UI display purposes
  uploadedBy: string;
  avatar: string;
  project: string[];
  source: string; // Keep as string for processing status display
  uploadDate: string;
  chunk?: number;
  syncStatus?: string;
  lastUpdated?: string;
}
