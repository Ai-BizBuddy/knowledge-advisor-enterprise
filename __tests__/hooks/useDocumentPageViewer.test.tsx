import { useDocumentPageViewer } from '@/hooks/useDocumentPageViewer';
import { DocumentPageService } from '@/services/DocumentPageService';
import { act, renderHook } from '@testing-library/react';

jest.mock('@/services/DocumentPageService');
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(),
  createClientTable: jest.fn(),
}));

const mockGetPages = DocumentPageService.getPagesByDocumentId as jest.Mock;
const mockUpdateContent = DocumentPageService.updatePageContent as jest.Mock;
const mockUpdateBBox = DocumentPageService.updatePageBBox as jest.Mock;

const samplePages = [
  {
    id: 'pg1', document_id: 'doc-1', page_number: 1, content: 'page 1 text',
    base64_image: 'abc123', page_count: 2, created_at: '2024-01-01', knowledge_base_id: 'kb-1',
    bbox: [{ image_id: 'img_1', bbox: [0.1, 0.2, 0.5, 0.6] }],
  },
  {
    id: 'pg2', document_id: 'doc-1', page_number: 2, content: 'page 2 text',
    base64_image: null, page_count: 2, created_at: '2024-01-01', knowledge_base_id: 'kb-1',
    bbox: null,
  },
];

describe('useDocumentPageViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads pages when loadPages is called', async () => {
    mockGetPages.mockResolvedValue({ success: true, data: samplePages });

    const { result } = renderHook(() =>
      useDocumentPageViewer({ initialDocumentId: 'doc-1', knowledgeBaseId: 'kb-1' })
    );

    await act(async () => {
      await result.current.loadPages('doc-1');
    });

    expect(mockGetPages).toHaveBeenCalledWith('doc-1');
    expect(result.current.pages).toHaveLength(2);
    expect(result.current.pages[0].id).toBe('pg1');
  });

  it('skips duplicate fetch for the same docId', async () => {
    mockGetPages.mockResolvedValue({ success: true, data: samplePages });

    const { result } = renderHook(() =>
      useDocumentPageViewer({ initialDocumentId: 'doc-1', knowledgeBaseId: 'kb-1' })
    );

    await act(async () => { await result.current.loadPages('doc-1'); });
    await act(async () => { await result.current.loadPages('doc-1'); }); // second call — should be skipped

    expect(mockGetPages).toHaveBeenCalledTimes(1);
  });

  it('selectPage updates currentPageNumber', async () => {
    mockGetPages.mockResolvedValue({ success: true, data: samplePages });

    const { result } = renderHook(() =>
      useDocumentPageViewer({ initialDocumentId: 'doc-1', knowledgeBaseId: 'kb-1' })
    );

    await act(async () => { await result.current.loadPages('doc-1'); });
    act(() => { result.current.selectPage(2); });

    expect(result.current.currentPageNumber).toBe(2);
  });

  it('currentPageBBoxes is derived from currentPage.bbox', async () => {
    mockGetPages.mockResolvedValue({ success: true, data: samplePages });

    const { result } = renderHook(() =>
      useDocumentPageViewer({ initialDocumentId: 'doc-1', knowledgeBaseId: 'kb-1', initialPage: 1 })
    );

    await act(async () => { await result.current.loadPages('doc-1'); });

    expect(result.current.currentPageBBoxes).toHaveLength(1);
    expect(result.current.currentPageBBoxes[0].image_id).toBe('img_1');
    expect(result.current.currentPageBBoxes[0].isNormalized).toBe(true);
  });

  it('updatePageBBox updates local state on success', async () => {
    mockGetPages.mockResolvedValue({ success: true, data: samplePages });
    mockUpdateBBox.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useDocumentPageViewer({ initialDocumentId: 'doc-1', knowledgeBaseId: 'kb-1', initialPage: 1 })
    );

    await act(async () => { await result.current.loadPages('doc-1'); });

    const newBBox = [{ image_id: 'img_1', bbox: [0.2, 0.3, 0.6, 0.7] }];
    await act(async () => {
      await result.current.updatePageBBox('pg1', newBBox);
    });

    expect(mockUpdateBBox).toHaveBeenCalledWith('pg1', newBBox);
    const updatedPage = result.current.pages.find((p) => p.id === 'pg1');
    expect(updatedPage?.bbox).toEqual(newBBox);
  });

  it('updatePageBBox throws when service returns failure', async () => {
    mockGetPages.mockResolvedValue({ success: true, data: samplePages });
    mockUpdateBBox.mockResolvedValue({ success: false, error: 'DB error' });

    const { result } = renderHook(() =>
      useDocumentPageViewer({ initialDocumentId: 'doc-1', knowledgeBaseId: 'kb-1', initialPage: 1 })
    );

    await act(async () => { await result.current.loadPages('doc-1'); });

    await expect(
      act(async () => { await result.current.updatePageBBox('pg1', []); })
    ).rejects.toThrow('DB error');
  });

  it('updatePageContent updates local state on success', async () => {
    mockGetPages.mockResolvedValue({ success: true, data: samplePages });
    mockUpdateContent.mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useDocumentPageViewer({ initialDocumentId: 'doc-1', knowledgeBaseId: 'kb-1', initialPage: 1 })
    );

    await act(async () => { await result.current.loadPages('doc-1'); });
    await act(async () => {
      await result.current.updatePageContent('pg1', 'updated text');
    });

    expect(mockUpdateContent).toHaveBeenCalledWith('pg1', 'updated text');
    const updated = result.current.pages.find((p) => p.id === 'pg1');
    expect(updated?.content).toBe('updated text');
  });
});
