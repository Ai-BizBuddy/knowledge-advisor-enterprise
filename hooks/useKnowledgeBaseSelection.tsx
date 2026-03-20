'use client';
import { knowledgeBaseService } from '@/services';
import { useCallback, useEffect, useState } from 'react';

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
    } catch {
      // Handle error silently
    } finally {
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

  const handleSelectAllKB = useCallback((selectedIds?: string[]) => {
    // If selectedIds is provided (from toggleAll in KnowledgeSelect), use it
    if (Array.isArray(selectedIds)) {
      const isSelectAll = selectedIds.length === knowledgeBases.length && knowledgeBases.length > 0;
      setSelectAllKB(isSelectAll);
      setKnowledgeBases((prev) =>
        prev.map((kb) => ({ ...kb, selected: selectedIds.includes(kb.id) })),
      );
      return;
    }

    // Default toggle behavior
    const newSelectAll = !selectAllKB;
    setSelectAllKB(newSelectAll);
    setKnowledgeBases((prev) =>
      prev.map((kb) => ({ ...kb, selected: newSelectAll })),
    );
  }, [selectAllKB, knowledgeBases.length]);

  const getSelectedKnowledgeBases = useCallback(() => {
    return knowledgeBases.filter((kb) => kb.selected);
  }, [knowledgeBases]);

  const getSelectedCount = useCallback(() => {
    return knowledgeBases.filter((kb) => kb.selected).length;
  }, [knowledgeBases]);

  const getSelectedList = useCallback(() => {
    return knowledgeBases.filter((kb) => kb.selected).map((kb) => kb.name);
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
    getSelectedList
  };
};
