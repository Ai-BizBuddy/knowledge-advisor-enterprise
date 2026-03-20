import { OCRTextPane } from '@/components/ocrViewer/OCRTextPane';
import type { OCRTextPaneProps } from '@/components/ocrViewer/OCRViewer.types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const mockShowToast = jest.fn();
jest.mock('@/components/toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const sampleMetadata = {
  id: 'sec-1',
  documentId: 'doc-1',
  page: 2,
  chunkIndex: 0,
  chunkTotal: 3,
  fileName: 'report.pdf',
  kbName: 'My KB',
  contentType: 'text',
  charCount: 100,
  tokenCount: 25,
  contextualHeaders: ['Intro', 'Summary'],
  bbox: null,
};

const defaultProps: OCRTextPaneProps = {
  content: 'Hello world',
  metadata: null,
  images: [{ id: 'page', base64: 'data:image/png;base64,abc' }],
};

describe('OCRTextPane', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders content in textarea', () => {
    render(<OCRTextPane {...defaultProps} />);
    expect(screen.getByDisplayValue('Hello world')).toBeInTheDocument();
  });

  it('textarea is readonly when onUpdate is not provided', () => {
    render(<OCRTextPane {...defaultProps} />);
    const ta = screen.getByDisplayValue('Hello world') as HTMLTextAreaElement;
    expect(ta.readOnly).toBe(true);
  });

  it('textarea is editable when onUpdate is provided', () => {
    render(<OCRTextPane {...defaultProps} onUpdate={jest.fn()} />);
    const ta = screen.getByDisplayValue('Hello world') as HTMLTextAreaElement;
    expect(ta.readOnly).toBe(false);
  });

  it('shows "Update Extracted Text" button only when content is dirty', async () => {
    render(<OCRTextPane {...defaultProps} onUpdate={jest.fn()} />);

    // Initially the button should not be visible (not dirty)
    expect(screen.queryByText('Update Extracted Text')).not.toBeInTheDocument();

    // Make content dirty
    const ta = screen.getByDisplayValue('Hello world');
    fireEvent.change(ta, { target: { value: 'Modified text' } });

    expect(screen.getByText('Update Extracted Text')).toBeInTheDocument();
  });

  it('calls onUpdate and shows success toast on save', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined);
    render(<OCRTextPane {...defaultProps} onUpdate={onUpdate} />);

    const ta = screen.getByDisplayValue('Hello world');
    fireEvent.change(ta, { target: { value: 'Updated content' } });

    fireEvent.click(screen.getByText('Update Extracted Text'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('Updated content');
      expect(mockShowToast).toHaveBeenCalledWith(
        'Section content updated successfully.',
        'success'
      );
    });
  });

  it('shows error toast when onUpdate throws', async () => {
    const onUpdate = jest.fn().mockRejectedValue(new Error('Save failed'));
    render(<OCRTextPane {...defaultProps} onUpdate={onUpdate} />);

    const ta = screen.getByDisplayValue('Hello world');
    fireEvent.change(ta, { target: { value: 'Changed' } });
    fireEvent.click(screen.getByText('Update Extracted Text'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('Failed to save changes.', 'error');
    });
  });

  it('renders "Update Embeddings" and "Force Re-OCR" when onPageReprocess is provided', () => {
    render(<OCRTextPane {...defaultProps} onPageReprocess={jest.fn()} />);
    expect(screen.getByText('Update Embeddings')).toBeInTheDocument();
    expect(screen.getByText('Force Re-OCR')).toBeInTheDocument();
  });

  it('calls onPageReprocess with forceOcr=false when "Update Embeddings" is clicked', () => {
    const onPageReprocess = jest.fn().mockResolvedValue(undefined);
    render(<OCRTextPane {...defaultProps} onPageReprocess={onPageReprocess} />);
    fireEvent.click(screen.getByText('Update Embeddings'));
    expect(onPageReprocess).toHaveBeenCalledWith(
      expect.objectContaining({ forceOcr: false })
    );
  });

  it('calls onPageReprocess with forceOcr=true when "Force Re-OCR" is clicked', () => {
    const onPageReprocess = jest.fn().mockResolvedValue(undefined);
    render(<OCRTextPane {...defaultProps} onPageReprocess={onPageReprocess} />);
    fireEvent.click(screen.getByText('Force Re-OCR'));
    expect(onPageReprocess).toHaveBeenCalledWith(
      expect.objectContaining({ forceOcr: true })
    );
  });

  it('disables reprocess buttons when isReprocessing=true', () => {
    render(
      <OCRTextPane
        {...defaultProps}
        onPageReprocess={jest.fn()}
        isReprocessing={true}
      />
    );
    // The "Update Embeddings" button shows "Processing…" text and is disabled
    const processingBtn = document.querySelector(
      'button[title*="re-generate vector embeddings"]'
    ) as HTMLButtonElement;
    expect(processingBtn).toBeDisabled();
    expect(screen.getByText('Force Re-OCR')).toBeDisabled();
  });

  it('renders frontmatter when metadata is provided', () => {
    render(<OCRTextPane {...defaultProps} metadata={sampleMetadata} />);
    expect(screen.getByText(/document_id: doc-1/i)).toBeInTheDocument();
    expect(screen.getByText(/page: 2/i)).toBeInTheDocument();
  });

  it('renders contextual headers from metadata', () => {
    render(<OCRTextPane {...defaultProps} metadata={sampleMetadata} />);
    expect(screen.getByText('Intro')).toBeInTheDocument();
    expect(screen.getByText('Summary')).toBeInTheDocument();
  });

  it('renders image ref badges from content', () => {
    render(
      <OCRTextPane
        {...defaultProps}
        content='Some text with ![fig](image_1_logo) reference'
      />
    );
    expect(screen.getByText('image_1_logo')).toBeInTheDocument();
  });

  it('calls onImageRefHover when hovering over image ref badge', () => {
    const onImageRefHover = jest.fn();
    render(
      <OCRTextPane
        {...defaultProps}
        content='Text ![alt](img_ref_1) here'
        onImageRefHover={onImageRefHover}
      />
    );
    const badge = screen.getByText('img_ref_1');
    fireEvent.mouseEnter(badge);
    expect(onImageRefHover).toHaveBeenCalledWith('img_ref_1');
    fireEvent.mouseLeave(badge);
    expect(onImageRefHover).toHaveBeenCalledWith(null);
  });
});
