'use client';

import type {
  DocumentSection,
  DocumentSectionMetadata,
  DocumentWithSections,
  OCRImage,
  OCRViewerState,
} from '@/interfaces/DocumentSection';
import documentSectionService from '@/services/DocumentSectionService';
import { updateSectionContent as patchSectionViaIngress } from '@/services/IngressService';
import { useCallback, useEffect, useState } from 'react';

interface UseDocumentSectionViewerOptions {
  initialDocumentId?: string;
  initialSectionId?: string;
  knowledgeBaseId?: string;
  /** When provided, only sections for this specific document are loaded. */
  documentId?: string;
}

interface UseDocumentSectionViewerReturn extends OCRViewerState {
  // Actions
  loadDocuments: () => Promise<void>;
  loadDocumentSections: (documentId: string) => Promise<void>;
  selectSection: (sectionId: string) => Promise<void>;
  selectDocument: (documentId: string) => void;
  updateSectionContent: (sectionId: string, content: string, token?: string) => Promise<void>;
  updateSectionBBox: (sectionId: string, bbox: number[]) => Promise<{ persisted: boolean }>;
  toggleDocumentExpanded: (documentId: string) => void;
  clearSelection: () => void;
  clearCurrentSection: () => void;
  // Computed
  currentMetadata: DocumentSectionMetadata | null;
  currentImages: OCRImage[];
  currentPage: number;
  currentDocumentName: string;
}

export function useDocumentSectionViewer(
  options: UseDocumentSectionViewerOptions = {},
): UseDocumentSectionViewerReturn {
  const { initialDocumentId, initialSectionId, knowledgeBaseId, documentId } = options;

  const [documents, setDocuments] = useState<DocumentWithSections[]>([]);
  const [currentSection, setCurrentSection] = useState<DocumentSection | null>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(
    initialDocumentId || null,
  );
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(
    new Set(initialDocumentId ? [initialDocumentId] : []),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all documents with sections
   */
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const docs = await documentSectionService.getDocumentsWithSections(knowledgeBaseId, documentId);
      setDocuments(docs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      setError(errorMessage);
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [knowledgeBaseId, documentId]);

  /**
   * Load sections for a specific document
   */
  const loadDocumentSections = useCallback(async (documentId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const sections = await documentSectionService.getDocumentSectionsByDocumentId(documentId);
      
      // Update the document in our list with the fetched sections
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId
            ? { ...doc, sections }
            : doc,
        ),
      );

      // Expand the document in sidebar
      setExpandedDocuments((prev) => new Set([...prev, documentId]));
      setCurrentDocumentId(documentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document sections';
      setError(errorMessage);
      console.error('Error loading document sections:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Select a specific section.
   * Checks already-loaded documents state first to avoid a Supabase round-trip
   * (and to keep bbox clicks working even when the session token has expired).
   * Falls back to a remote fetch only when the section isn't cached locally.
   */
  const selectSection = useCallback(async (sectionId: string) => {
    // --- 1. Try local cache first ---
    for (const doc of documents) {
      const cached = doc.sections.find((s) => s.id === sectionId);
      if (cached) {
        setCurrentSection(cached);
        const metadata = cached.metadata as DocumentSectionMetadata | null;
        if (metadata?.document_id) {
          setCurrentDocumentId(metadata.document_id);
          setExpandedDocuments((prev) => new Set([...prev, metadata.document_id]));
        }
        return; // done — no network request needed
      }
    }

    // --- 2. Not in cache — fetch from Supabase ---
    setIsLoading(true);
    setError(null);

    try {
      const section = await documentSectionService.getDocumentSectionById(sectionId);
      
      if (section) {
        setCurrentSection(section);

        // Update current document ID from metadata
        const metadata = section.metadata as DocumentSectionMetadata | null;
        if (metadata?.document_id) {
          setCurrentDocumentId(metadata.document_id);
          setExpandedDocuments((prev) => new Set([...prev, metadata.document_id]));
        }
      } else {
        setError('Section not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load section';
      setError(errorMessage);
      console.error('Error loading section:', err);
    } finally {
      setIsLoading(false);
    }
  }, [documents]);

  /**
   * Toggle document expanded state in sidebar
   */
  const toggleDocumentExpanded = useCallback((documentId: string) => {
    setExpandedDocuments((prev) => {
      const next = new Set(prev);
      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }
      return next;
    });
  }, []);

  /**
   * Clear current selection
   */
  const clearSelection = useCallback(() => {
    setCurrentSection(null);
    setCurrentDocumentId(null);
  }, []);

  /**
   * Clear only the current section selection
   */
  const clearCurrentSection = useCallback(() => {
    setCurrentSection(null);
  }, []);

  /**
   * Update content of a section.
   * When a JWT token is provided, calls the ingress PATCH endpoint
   * (which also re-generates embeddings). Falls back to a direct
   * Supabase write when no token is available.
   */
  const updateSectionContent = useCallback(async (sectionId: string, content: string, token?: string) => {
    // Optimistically update local state first — user sees change immediately regardless of DB outcome
    if (currentSection?.id === sectionId) {
      setCurrentSection((prev) => (prev ? { ...prev, content } : null));
    }
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => ({
        ...doc,
        sections: doc.sections.map((section) =>
          section.id === sectionId ? { ...section, content } : section
        ),
      }))
    );

    // Attempt persistent storage (best-effort — may be blocked by RLS)
    try {
      let usedIngress = false;

      if (token) {
        // Try ingress service PATCH endpoint first (re-generates embeddings)
        const res = await patchSectionViaIngress(token, sectionId, content);
        if (res.success) {
          usedIngress = true;
        } else {
          // Ingress PATCH failed (e.g. 404 — endpoint not yet deployed).
          // Fall back to direct Supabase write so the user isn't blocked.
          console.warn(
            'Ingress PATCH failed, falling back to direct Supabase update:',
            res.error,
          );
        }
      }

      if (!usedIngress) {
        // Direct Supabase write (no embedding regeneration)
        await documentSectionService.updateDocumentSectionContent(sectionId, content);
      }
    } catch (err) {
      // DB persistence failed — local state is still updated for this session
      console.warn('Failed to persist section content to DB (local state still updated):', err);
    }
  }, [currentSection?.id]);

  /**
   * Update the bounding box for a section.
   * Persists to Supabase metadata.custom_metadata.user_bbox AND localStorage
   * (localStorage survives the server-side async trigger that resets metadata).
   */
  const updateSectionBBox = useCallback(async (sectionId: string, bbox: number[]): Promise<{ persisted: boolean }> => {
    // Find the section in local state
    const targetSection = currentSection?.id === sectionId
      ? currentSection
      : documents.flatMap((d) => d.sections).find((s) => s.id === sectionId);

    if (!targetSection) {
      throw new Error('Section not found in local state');
    }

    const prevMetadata = targetSection.metadata as DocumentSectionMetadata | null;
    if (!prevMetadata) {
      throw new Error('Section has no metadata');
    }

    // Store bbox in custom_metadata.user_bbox (avoids server trigger overwriting metadata.bbox).
    // We do NOT touch images or the top-level bbox field to prevent the trigger from resetting them.
    const updatedCustomMetadata: Record<string, unknown> = {
      ...(prevMetadata.custom_metadata || {}),
      user_bbox: bbox,
    };

    const updatedMetadata: DocumentSectionMetadata = {
      ...prevMetadata,
      custom_metadata: updatedCustomMetadata,
    };

    // Optimistically update local state + localStorage FIRST (before DB write)
    if (currentSection?.id === sectionId) {
      setCurrentSection((prev) =>
        prev ? { ...prev, metadata: updatedMetadata } : null
      );
    }
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => ({
        ...doc,
        sections: doc.sections.map((section) =>
          section.id === sectionId
            ? { ...section, metadata: updatedMetadata }
            : section
        ),
      }))
    );

    // Persist to localStorage (reliable fallback — server triggers may reset metadata)
    try {
      const storageKey = `section_bbox_${sectionId}`;
      localStorage.setItem(storageKey, JSON.stringify(bbox));
    } catch {
      // localStorage unavailable (SSR/private browsing) — silently skip
    }

    // Attempt DB write (best-effort — may be blocked by RLS)
    try {
      await documentSectionService.updateSectionMetadata(sectionId, updatedMetadata);
      return { persisted: true };
    } catch (err) {
      console.warn('Failed to persist bbox to DB (saved locally):', err);
      return { persisted: false };
    }
  }, [currentSection, documents]);

  // Computed values
  const currentMetadata = currentSection?.metadata as DocumentSectionMetadata | null;
  const currentImages = currentMetadata?.images || [];
  const currentPage = currentMetadata?.page || 0;
  const currentDocumentName = currentMetadata?.file_name || '';

  const selectDocument = useCallback((documentId: string) => {
    setCurrentDocumentId(documentId);
    // Auto-expand
    setExpandedDocuments((prev) => new Set([...prev, documentId]));
  }, []);

  // Initial load
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Load initial section if provided
  useEffect(() => {
    if (initialSectionId) {
      selectSection(initialSectionId);
    }
  }, [initialSectionId, selectSection]);

  return {
    // State
    documents,
    currentSection,
    currentDocumentId,
    expandedDocuments,
    isLoading,
    error,
    // Actions
    loadDocuments,
    loadDocumentSections,
    selectSection,
    selectDocument,
    updateSectionContent,
    updateSectionBBox,
    toggleDocumentExpanded,
    clearSelection,
    clearCurrentSection,
    // Computed
    currentMetadata,
    currentImages,
    currentPage,
    currentDocumentName,
  };
}
