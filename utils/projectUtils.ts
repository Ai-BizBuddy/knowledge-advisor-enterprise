import { ProjectStatus, ProjectStatusDisplay } from "@/interfaces/Project";

/**
 * Convert numeric status to display string
 */
export function getStatusDisplay(status: ProjectStatus): ProjectStatusDisplay {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return "Active";
    case ProjectStatus.PAUSED:
      return "Paused";
    case ProjectStatus.DRAFT:
      return "Draft";
    default:
      return "Draft";
  }
}

/**
 * Convert display status to numeric value
 */
export function getStatusValue(status: ProjectStatusDisplay): ProjectStatus {
  switch (status) {
    case "Active":
      return ProjectStatus.ACTIVE;
    case "Paused":
      return ProjectStatus.PAUSED;
    case "Draft":
      return ProjectStatus.DRAFT;
    default:
      return ProjectStatus.DRAFT;
  }
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: ProjectStatus | string | number): string {
  let displayStatus: string;
  
  if (typeof status === 'number') {
    displayStatus = getStatusDisplay(status as ProjectStatus);
  } else if (typeof status === 'string') {
    displayStatus = status;
  } else {
    displayStatus = getStatusDisplay(status);
  }
  
  switch (displayStatus.toLowerCase()) {
    case 'active':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'paused':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'draft':
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    default:
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: "Project name is required" };
  }
  
  if (name.trim().length < 3) {
    return { isValid: false, error: "Project name must be at least 3 characters long" };
  }
  
  if (name.trim().length > 100) {
    return { isValid: false, error: "Project name cannot exceed 100 characters" };
  }
  
  // Check for invalid characters (basic validation)
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    return { isValid: false, error: "Project name contains invalid characters" };
  }
  
  return { isValid: true };
}

/**
 * Validate project description
 */
export function validateProjectDescription(description: string): { isValid: boolean; error?: string } {
  if (!description || description.trim().length === 0) {
    return { isValid: false, error: "Project description is required" };
  }
  
  if (description.trim().length < 10) {
    return { isValid: false, error: "Description must be at least 10 characters long" };
  }
  
  if (description.trim().length > 500) {
    return { isValid: false, error: "Description cannot exceed 500 characters" };
  }
  
  return { isValid: true };
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  // Older than a week, show actual date
  return date.toLocaleDateString();
}

/**
 * Generate project slug from name
 */
export function generateProjectSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}
