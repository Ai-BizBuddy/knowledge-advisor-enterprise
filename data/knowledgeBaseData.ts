import { Project, ProjectStatus } from "@/interfaces/Project";
import { knowledgeBaseService } from "@/services";

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
export const formatStatus = (status: ProjectStatus): string => {
  switch (status) {
    case ProjectStatus.ACTIVE:
      return "Active";
    case ProjectStatus.PAUSED:
      return "Paused";
    case ProjectStatus.DRAFT:
      return "Draft";
    default:
      return "Unknown";
  }
};

/**
 * Get knowledge base by ID using the service layer
 * @param id - Knowledge base ID
 * @returns Promise<KnowledgeBaseData | null>
 */
export const getKnowledgeBaseById = async (
  id: string,
): Promise<KnowledgeBaseData | null> => {
  try {
    const project = await knowledgeBaseService.getProject(id);
    if (!project) {
      return null;
    }

    // Transform Project to KnowledgeBaseData
    const knowledgeBaseData: KnowledgeBaseData = {
      ...project,
      documentsCount: project.document_count || 0,
      category: "General",
      tags: [],
    };

    return knowledgeBaseData;
  } catch (error) {
    console.error("Error fetching knowledge base by ID:", error);
    return null;
  }
};
