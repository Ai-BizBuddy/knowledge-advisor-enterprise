import {
    adminBackfillAll,
    backfillPageImages,
    reprocessPage,
    updateSectionContent,
} from '@/services/IngressService';

// Plain mock response helper — jsdom does not support `new Response()`
function mockFetch(body: unknown, ok = true, status = 200) {
  const json = JSON.stringify(body);
  return Promise.resolve({
    ok,
    status,
    headers: {
      get: (h: string) => (h === 'content-type' ? 'application/json' : null),
    } as unknown as Headers,
    text: () => Promise.resolve(json),
  });
}

describe('IngressService', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('reprocessPage', () => {
    it('sends POST /ingress/page with correct body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetch({ message: 'ok', jobId: 'j1', status: 'queued', page: 3, reprocessOcr: false })
      );

      await reprocessPage('token-abc', {
        document_id: 'doc-1',
        page_number: 3,
        content: 'hello world',
      });

      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/ingress/page');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toMatchObject({
        document_id: 'doc-1',
        page_number: 3,
        content: 'hello world',
      });
      expect(init.headers).toMatchObject({ Authorization: 'Bearer token-abc' });
    });

    it('sends content: null when forceOcr', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetch({ message: 'ok', jobId: 'j2', status: 'queued', page: 1, reprocessOcr: true })
      );

      await reprocessPage('tok', { document_id: 'doc-2', page_number: 1, content: null });

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body as string);
      expect(body.content).toBeNull();
    });

    it('returns success: true with data on 200', async () => {
      const payload = { message: 'ok', jobId: 'j3', status: 'queued', page: 2, reprocessOcr: false };
      (global.fetch as jest.Mock).mockResolvedValue(mockFetch(payload));

      const result = await reprocessPage('tok', {
        document_id: 'doc-3',
        page_number: 2,
        content: 'text',
      });

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(payload);
    });

    it('returns success: false on 4xx response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetch({ error: 'document not found' }, false, 404)
      );

      const result = await reprocessPage('tok', {
        document_id: 'bad-doc',
        page_number: 1,
        content: null,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('document not found');
    });

    it('returns success: false on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

      const result = await reprocessPage('tok', {
        document_id: 'doc-1',
        page_number: 1,
        content: null,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network failure');
    });
  });

  describe('updateSectionContent', () => {
    it('sends PATCH /documents/sections/{id} with content', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetch({ sectionId: 'sec-1', content: 'updated' })
      );

      await updateSectionContent('tok', 'sec-1', 'updated');

      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/documents/sections/sec-1');
      expect(init.method).toBe('PATCH');
      expect(JSON.parse(init.body as string)).toEqual({ content: 'updated' });
    });

    it('returns success: true on 200', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        mockFetch({ sectionId: 's', content: 'x' })
      );
      const result = await updateSectionContent('tok', 's', 'x');
      expect(result.success).toBe(true);
    });
  });

  describe('backfillPageImages', () => {
    it('sends POST /ingress/backfill-pages/{docId}', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockFetch({}));

      await backfillPageImages('tok', 'doc-xyz');

      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/ingress/backfill-pages/doc-xyz');
      expect(init.method).toBe('POST');
    });
  });

  describe('adminBackfillAll', () => {
    it('sends POST /admin/backfill-pages/all', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(mockFetch({}));

      await adminBackfillAll('admin-tok');

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/admin/backfill-pages/all');
    });
  });
});
