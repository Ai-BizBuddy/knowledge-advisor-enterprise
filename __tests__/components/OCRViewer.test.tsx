import { OCRViewer } from '@/components/ocrViewer/OCRViewer';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// ── Mock next/image ───────────────────────────────────────────────────────────
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// ── Mock toast ────────────────────────────────────────────────────────────────
const mockShowToast = jest.fn();
jest.mock('@/components/toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// ── Mock AuthContext ──────────────────────────────────────────────────────────
let mockSession: { access_token: string } | null = null;
jest.mock('@/contexts/AuthContext', () => ({
  useAuthContext: () => ({ session: mockSession }),
}));

// ── Mock useDocumentSectionViewer ────────────────────────────────────────────
const mockSectionViewer = {
  documents: [],
  currentSection: null,
  currentDocumentId: null,
  expandedDocuments: new Set(),
  isLoading: false,
  error: null,
  loadDocuments: jest.fn(),
  selectSection: jest.fn(),
  selectDocument: jest.fn(),
  toggleDocumentExpanded: jest.fn(),
  updateSectionContent: jest.fn(),
  updateSectionBBox: jest.fn(),
  currentMetadata: null,
  currentImages: [],
  currentDocumentName: null,
  clearCurrentSection: jest.fn(),
};

jest.mock('@/hooks/useDocumentSectionViewer', () => ({
  useDocumentSectionViewer: () => mockSectionViewer,
}));

// ── Mock useDocumentPageViewer ────────────────────────────────────────────────
const mockPageViewer = {
  pages: [],
  currentPageNumber: 0,
  currentPage: null,
  currentImageUrl: null,
  currentPageBBoxes: [],
  isLoading: false,
  error: null,
  loadPages: jest.fn(),
  selectPage: jest.fn(),
  updatePageContent: jest.fn(),
  updatePageBBox: jest.fn(),
};

jest.mock('@/hooks/useDocumentPageViewer', () => ({
  useDocumentPageViewer: () => mockPageViewer,
}));

// ── Mock useDocumentPagesMap ──────────────────────────────────────────────────
const mockPagesMapViewer = {
  pagesMap: new Map(),
  reload: jest.fn(),
  loadPagesForDocument: jest.fn(),
  isDocumentLoading: () => false,
  goToDocumentPage: jest.fn(),
  getDocPagination: () => null,
};

jest.mock('@/hooks/useDocumentPagesMap', () => ({
  useDocumentPagesMap: () => mockPagesMapViewer,
}));

// ── Mock IngressService ───────────────────────────────────────────────────────
const mockBackfillPageImages = jest.fn();
const mockAdminBackfillAll = jest.fn();
const mockReprocessPage = jest.fn();
jest.mock('@/services/IngressService', () => ({
  backfillPageImages: (...args: unknown[]) => mockBackfillPageImages(...args),
  adminBackfillAll: (...args: unknown[]) => mockAdminBackfillAll(...args),
  reprocessPage: (...args: unknown[]) => mockReprocessPage(...args),
}));

// ── Mock OCRViewerSidebar (heavy child) ───────────────────────────────────────
jest.mock('@/components/ocrViewer/OCRViewerSidebar', () => ({
  OCRViewerSidebar: () => <div data-testid='ocr-sidebar'>Sidebar</div>,
}));

// ── Mock OCRMetadataDrawer ────────────────────────────────────────────────────
jest.mock('@/components/ocrViewer/OCRMetadataDrawer', () => ({
  OCRMetadataDrawer: () => <div data-testid='ocr-metadata'>Metadata</div>,
}));

describe('OCRViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = null;

    Object.assign(mockSectionViewer, {
      documents: [],
      currentSection: null,
      currentDocumentId: null,
      expandedDocuments: new Set(),
      isLoading: false,
      error: null,
      currentMetadata: null,
      currentImages: [],
      currentDocumentName: null,
    });

    Object.assign(mockPageViewer, {
      pages: [],
      currentPageNumber: 0,
      currentPage: null,
      currentImageUrl: null,
      currentPageBBoxes: [],
      isLoading: false,
      error: null,
    });

    Object.assign(mockPagesMapViewer, {
      pagesMap: new Map(),
    });
  });

  const defaultProps = {
    initialDocumentId: null,
    initialSectionId: null,
    knowledgeBaseId: 'kb-1',
  };

  it('renders OCR Studio header', () => {
    render(<OCRViewer {...defaultProps} />);
    expect(screen.getByText('OCR Studio')).toBeInTheDocument();
  });

  it('renders Sync button', () => {
    render(<OCRViewer {...defaultProps} />);
    expect(screen.getByText('Sync')).toBeInTheDocument();
  });

  it('shows toast error when Sync is clicked without a session', async () => {
    render(<OCRViewer {...defaultProps} />);
    fireEvent.click(screen.getByText('Sync'));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Authentication token missing.',
        'error'
      );
    });
  });

  it('does not call backfillPageImages without a session', async () => {
    render(<OCRViewer {...defaultProps} />);
    fireEvent.click(screen.getByText('Sync'));
    await waitFor(() => {
      expect(mockBackfillPageImages).not.toHaveBeenCalled();
      expect(mockAdminBackfillAll).not.toHaveBeenCalled();
    });
  });

  it('calls backfillPageImages when syncing a selected document', async () => {
    mockSession = { access_token: 'token-123' };
    mockSectionViewer.currentDocumentId = 'doc-1';
    mockBackfillPageImages.mockResolvedValue({ success: true });

    render(<OCRViewer {...defaultProps} />);
    fireEvent.click(screen.getByText('Sync'));

    await waitFor(() => {
      expect(mockBackfillPageImages).toHaveBeenCalledWith('token-123', 'doc-1');
      expect(mockShowToast).toHaveBeenCalledWith('Page sync started. Please wait...', 'success');
    });
  });

  it('calls adminBackfillAll when no document is selected and a session exists', async () => {
    mockSession = { access_token: 'token-xyz' };
    mockAdminBackfillAll.mockResolvedValue({ success: true });

    render(<OCRViewer {...defaultProps} />);
    fireEvent.click(screen.getByText('Sync'));

    await waitFor(() => {
      expect(mockAdminBackfillAll).toHaveBeenCalledWith('token-xyz');
      expect(mockShowToast).toHaveBeenCalledWith('Backfill started for all documents.', 'success');
    });
  });

  it('renders sidebar', () => {
    render(<OCRViewer {...defaultProps} />);
    expect(screen.getByTestId('ocr-sidebar')).toBeInTheDocument();
  });

  it('opens metadata drawer when Metadata button is clicked', () => {
    render(<OCRViewer {...defaultProps} />);
    // Use role button to distinguish from the drawer content itself
    const metadataButton = screen.getByRole('button', { name: /Metadata/i });
    fireEvent.click(metadataButton);
    expect(screen.getByTestId('ocr-metadata')).toBeInTheDocument();
  });

  it('renders Metadata button', () => {
    render(<OCRViewer {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Metadata/i })).toBeInTheDocument();
  });

  it('shows auth error and does not reprocess page without a session token', async () => {
    mockSectionViewer.currentDocumentId = 'doc-1';
    mockSectionViewer.currentDocumentName = 'Doc 1';
    mockPageViewer.currentPageNumber = 2;
    mockPageViewer.currentPage = {
      id: 'page-1',
      document_id: 'doc-1',
      page_number: 2,
      content: 'page content',
      base64_image: 'abc123',
      page_count: 3,
      created_at: '2024-01-01T00:00:00Z',
      knowledge_base_id: 'kb-1',
      bbox: [],
    };

    render(<OCRViewer {...defaultProps} />);
    fireEvent.click(screen.getByText('Update Embeddings'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Authentication token missing.', 'error');
      expect(mockReprocessPage).not.toHaveBeenCalled();
    });
  });

  it('calls reprocessPage with page content when Update Embeddings is clicked', async () => {
    mockSession = { access_token: 'token-reprocess' };
    mockSectionViewer.currentDocumentId = 'doc-1';
    mockSectionViewer.currentDocumentName = 'Doc 1';
    mockPageViewer.currentPageNumber = 2;
    mockPageViewer.currentPage = {
      id: 'page-1',
      document_id: 'doc-1',
      page_number: 2,
      content: 'page content',
      base64_image: 'abc123',
      page_count: 3,
      created_at: '2024-01-01T00:00:00Z',
      knowledge_base_id: 'kb-1',
      bbox: [],
    };
    mockReprocessPage.mockResolvedValue({ success: true });

    render(<OCRViewer {...defaultProps} />);
    fireEvent.click(screen.getByText('Update Embeddings'));

    await waitFor(() => {
      expect(mockReprocessPage).toHaveBeenCalledWith('token-reprocess', {
        document_id: 'doc-1',
        page_number: 2,
        content: 'page content',
      });
      expect(mockShowToast).toHaveBeenCalledWith(
        'Embedding update queued. Check Hangfire for progress.',
        'success'
      );
    });
  });

  it('does not crash with initialDocumentId set', () => {
    expect(() =>
      render(<OCRViewer {...defaultProps} initialDocumentId='doc-123' />)
    ).not.toThrow();
  });
});
