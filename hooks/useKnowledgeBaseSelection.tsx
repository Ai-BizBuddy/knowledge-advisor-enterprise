import { useState, useEffect, useCallback } from "react";
import { knowledgeBaseService } from "@/services";

export interface KnowledgeBaseSelection {
  id: string; // Updated to string UUID
  name: string;
  selected: boolean;
  documentCount: number;
}

export const useKnowledgeBaseSelection = () => {
  const [knowledgeBases, setKnowledgeBases] = useState<
    KnowledgeBaseSelection[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectAllKB, setSelectAllKB] = useState(false);
  const loadKnowledgeBases = useCallback(async () => {
    try {
      const projects = await knowledgeBaseService.getProjects();
      const kbSelection: KnowledgeBaseSelection[] = projects.data.map(
        (project) => ({
          id: project.id,
          name: project.name,
          selected: false,
          documentCount: project.document_count || 0,
        }),
      );
      setKnowledgeBases(kbSelection);
      setLoading(false);
    } catch (error) {
      console.error("Error loading knowledge bases:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKnowledgeBases();
  }, [loadKnowledgeBases]);
  const handleSelectKnowledgeBase = useCallback((kbId: string) => {
    setKnowledgeBases((prev) =>
      prev.map((kb) =>
        kb.id === kbId ? { ...kb, selected: !kb.selected } : kb,
      ),
    );
  }, []);

  const handleSelectAllKB = useCallback(() => {
    const newSelectAll = !selectAllKB;
    setSelectAllKB(newSelectAll);
    setKnowledgeBases((prev) =>
      prev.map((kb) => ({ ...kb, selected: newSelectAll })),
    );
  }, [selectAllKB]);

  const getSelectedKnowledgeBases = useCallback(() => {
    return knowledgeBases.filter((kb) => kb.selected);
  }, [knowledgeBases]);

  const getSelectedCount = useCallback(() => {
    return knowledgeBases.filter((kb) => kb.selected).length;
  }, [knowledgeBases]);

  const getTotalDocuments = useCallback(() => {
    return knowledgeBases
      .filter((kb) => kb.selected)
      .reduce((sum, kb) => sum + kb.documentCount, 0);
  }, [knowledgeBases]);

  return {
    knowledgeBases,
    loading,
    selectAllKB,
    handleSelectKnowledgeBase,
    handleSelectAllKB,
    getSelectedKnowledgeBases,
    getSelectedCount,
    getTotalDocuments,
  };
};
