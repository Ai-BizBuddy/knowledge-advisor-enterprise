import { Project, ProjectStatus } from "@/interfaces/Project";

export interface KnowledgeBaseData extends Project {
    queries?: number;
    accuracy?: number;
    lastSync?: string;
    storageSize?: string;
    documentsCount?: number;
    category?: string;
    tags?: string[];
}

// Helper function to format status for display
export const formatStatus = (status: boolean): string => {
    return status ? "Active" : "Inactive";
}
