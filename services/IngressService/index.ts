import type { TypedResponse } from '@/interfaces/ApiTypes';
import type { IngressDeepSearchRequest, IngressMetadata, IngressRequest, PageReprocessRequest, PageReprocessResponse, SectionUpdateResponse } from '@/interfaces/Ingress';

const BASE_URL = process.env.NEXT_PUBLIC_INGRESS_SERVICE || 'https://ingress-service.aifactories.space';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit
): Promise<TypedResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const contentType = response.headers.get('content-type');
    let data = {};
    if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
    }

    if (!response.ok) {
      const errorData = data as { error?: string; message?: string };
      return {
        success: false,
        error: errorData.error || errorData.message || `Request failed with status ${response.status}`,
        details: data as Record<string, unknown>,
      };
    }

    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function runIngress(
  token: string,
  data: IngressRequest
): Promise<TypedResponse<IngressMetadata>> {
  return apiRequest<IngressMetadata>('/ingress', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function backfillPageImages(
  token: string,
  documentId: string
): Promise<TypedResponse<void>> {
  return apiRequest<void>(`/ingress/backfill-pages/${documentId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getIngressMetadata(
  token: string,
  documentId: string
): Promise<TypedResponse<IngressMetadata>> {
  return apiRequest<IngressMetadata>(`/ingress/${documentId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function cancelIngress(
  token: string,
  documentId: string
): Promise<TypedResponse<void>> {
  return apiRequest<void>(`/ingress/${documentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deepSearch(
  token: string,
  data: IngressDeepSearchRequest
): Promise<TypedResponse<unknown>> {
  return apiRequest<unknown>('/deep-search', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function adminBackfillAll(
  token: string
): Promise<TypedResponse<void>> {
  return apiRequest<void>('/admin/backfill-pages/all', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Update a document section's text content via the ingress service.
 * Calls PATCH /documents/sections/{sectionId} as defined in OCR_STUDIO_FRONTEND.md.
 * The backend re-generates embeddings from the corrected text.
 */
export async function updateSectionContent(
  token: string,
  sectionId: string,
  content: string,
): Promise<TypedResponse<SectionUpdateResponse>> {
  return apiRequest<SectionUpdateResponse>(`/documents/sections/${sectionId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
}

/**
 * Reprocess a single page via the ingress service.
 * - Pass `content` (string) to update the text and re-generate embeddings (skips OCR).
 * - Pass `content: null` to force a fresh OCR scan for that page.
 * Calls POST /ingress/page.
 */
export async function reprocessPage(
  token: string,
  data: PageReprocessRequest,
): Promise<TypedResponse<PageReprocessResponse>> {
  return apiRequest<PageReprocessResponse>('/ingress/page', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}
