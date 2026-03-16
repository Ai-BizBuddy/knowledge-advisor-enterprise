import { DocumentPageService } from '@/services/DocumentPageService';

// ── Supabase chain mocks ────────────────────────────────────────────────────
const mockEq = jest.fn();
const mockUpdate = jest.fn();
const mockSelect = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: 'https://example.com/bucket/doc-1/pages/2.png' },
        })),
      })),
    },
  })),
  createClientTable: jest.fn(() => ({ from: mockFrom })),
}));

/** Build a Supabase select chain: from → select → eq → order → limit */
function buildSelectChain(data: unknown, error: unknown = null) {
  const chain = { data, error, count: null };
  mockLimit.mockResolvedValue(chain);
  mockOrder.mockReturnValue({ limit: mockLimit });
  mockEq.mockReturnValue({ order: mockOrder, eq: mockEq });
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder });
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
}

/** Build a Supabase update chain: from → update → eq */
function buildUpdateChain(error: unknown = null) {
  mockEq.mockResolvedValue({ error });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
}

describe('DocumentPageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updatePageBBox', () => {
    it('calls update({ bbox }).eq("id", pageId)', async () => {
      buildUpdateChain(null);

      const bbox = [{ image_id: 'img_1', bbox: [0.1, 0.2, 0.5, 0.6] }];
      await DocumentPageService.updatePageBBox('page-123', bbox);

      expect(mockFrom).toHaveBeenCalledWith('document_page');
      expect(mockUpdate).toHaveBeenCalledWith({ bbox });
      expect(mockEq).toHaveBeenCalledWith('id', 'page-123');
    });

    it('returns success: true on no error', async () => {
      buildUpdateChain(null);
      const result = await DocumentPageService.updatePageBBox('p1', []);
      expect(result.success).toBe(true);
    });

    it('returns success: false on error', async () => {
      buildUpdateChain({ message: 'DB write failed' });
      const result = await DocumentPageService.updatePageBBox('p1', []);
      expect(result.success).toBe(false);
      expect(result.error).toBe('DB write failed');
    });
  });

  describe('updatePageContent', () => {
    it('calls update({ content }).eq("id", pageId)', async () => {
      buildUpdateChain(null);

      await DocumentPageService.updatePageContent('page-456', 'new text');

      expect(mockUpdate).toHaveBeenCalledWith({ content: 'new text' });
      expect(mockEq).toHaveBeenCalledWith('id', 'page-456');
    });

    it('returns success: false on DB error', async () => {
      buildUpdateChain({ message: 'constraint violation' });
      const result = await DocumentPageService.updatePageContent('p2', 'x');
      expect(result.success).toBe(false);
      expect(result.error).toBe('constraint violation');
    });
  });

  describe('getPagesByDocumentId', () => {
    it('returns mapped pages on success', async () => {
      const pages = [
        { id: 'pg1', document_id: 'doc-1', page_number: 1, content: 'hello', page_count: 2, created_at: '2024-01-01', knowledge_base_id: 'kb-1' },
        { id: 'pg2', document_id: 'doc-1', page_number: 2, content: 'world', page_count: 2, created_at: '2024-01-01', knowledge_base_id: 'kb-1' },
      ];
      buildSelectChain(pages);

      const result = await DocumentPageService.getPagesByDocumentId('doc-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].id).toBe('pg1');
    });

    it('returns success: false on DB error', async () => {
      buildSelectChain(null, { message: 'query failed' });
      const result = await DocumentPageService.getPagesByDocumentId('doc-bad');
      expect(result.success).toBe(false);
      expect(result.error).toBe('query failed');
    });
  });

  describe('getPageImageUrl', () => {
    it('returns the public URL from Supabase storage', () => {
      const url = DocumentPageService.getPageImageUrl('kb-1', 'doc-1', 2);
      expect(url).toBe('https://example.com/bucket/doc-1/pages/2.png');
    });
  });
});
