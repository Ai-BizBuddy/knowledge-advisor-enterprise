import { useState, useEffect, useCallback } from "react";
import {
  getAllDocuments,
  getDocumentsByProjectId,
} from "@/services/Project/supabase";
import { createClientTable } from "@/utils/supabase/client";
import type { Document } from "@/interfaces/Project";

export interface UseDocumentsOptions {
  projectId?: string;
  autoLoad?: boolean;
}

export interface UseDocumentsReturn {
  documents: Document[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getDocumentById: (documentId: string) => Promise<Document | null>;
  filterDocuments: (
    type?: string,
    status?: string,
    searchQuery?: string,
    sortBy?: "name" | "date" | "size",
  ) => Document[];
}

/**
 * Custom hook for managing documents
 * Can fetch all documents or documents for a specific project
 */
export function useDocuments(
  options: UseDocumentsOptions = {},
): UseDocumentsReturn {
  const { projectId, autoLoad = true } = options;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!autoLoad) return;

    setLoading(true);
    setError(null);

    try {
      let data: Document[];

      if (projectId) {
        data = await getDocumentsByProjectId(projectId);
      } else {
        data = await getAllDocuments();
      }

      setDocuments(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch documents";
      console.error("Error fetching documents:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [projectId, autoLoad]);

  const refetch = useCallback(async () => {
    await fetchDocuments();
  }, [fetchDocuments]);

  const filterDocuments = (searchQuery?: string): Document[] => {
    let filtered = documents;

    // Filter by search query
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((doc) => {
        const projectName = doc.metadata?.project_name;
        const uploadedBy = doc.metadata?.uploaded_by;

        return (
          doc.name.toLowerCase().includes(query) ||
          (typeof projectName === "string" &&
            projectName.toLowerCase().includes(query)) ||
          (typeof uploadedBy === "string" &&
            uploadedBy.toLowerCase().includes(query))
        );
      });
    }

    return filtered;
  };

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const getDocumentById = useCallback(
    async (documentId: string): Promise<Document | null> => {
      try {
        // First check if we have it in the loaded documents
        const foundDocument = documents.find((doc) => doc.id === documentId);
        if (foundDocument) {
          return foundDocument;
        }

        const supabase = createClientTable();
        const { data: document, error } = await supabase
          .from("documents")
          .select(
            `
          id,
          name,
          type,
          status,
          project_id,
          chunk_count,
          file_size,
          mime_type,
          created_at,
          updated_at,
          path,
          url,
          rag_status,
          last_rag_sync,
          metadata,
          knowledge_base:project_id (
            name,
            owner
          )
        `,
          )
          .eq("id", documentId)
          .single();

        if (error) {
          console.error(`Error fetching document ${documentId}:`, error);
          return null;
        }

        if (!document) {
          return null;
        }

        // Transform the document to include project name in metadata
        const documentWithProjectInfo = {
          ...document,
          metadata: {
            ...document.metadata,
            project_name:
              document.knowledge_base?.[0]?.name || "Unknown Project",
          },
        } as Document;

        return documentWithProjectInfo;
      } catch (error) {
        console.error(`Error fetching document ${documentId}:`, error);
        return null;
      }
    },
    [documents],
  );

  return {
    documents,
    loading,
    error,
    refetch,
    getDocumentById,
    filterDocuments,
  };
}

export default useDocuments;
