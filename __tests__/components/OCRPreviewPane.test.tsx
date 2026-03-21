import { OCRPreviewPane } from '@/components/ocrViewer/OCRPreviewPane';
import type { OCRPreviewPaneProps } from '@/components/ocrViewer/OCRViewer.types';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import NextImage from 'next/image';

// Mock next/image as a plain <img>
jest.mock('next/image', () => {
  const MockNextImage = React.forwardRef(
    (
      props: React.ImgHTMLAttributes<HTMLImageElement>,
      ref: React.Ref<HTMLImageElement>,
    ) => {
      const { src, alt, onLoad, ...rest } =
        props as React.ImgHTMLAttributes<HTMLImageElement> & {
          unoptimized?: boolean;
        };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { unoptimized, ...validRest } = rest as any;

      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={ref} src={src} alt={alt} onLoad={onLoad} {...validRest} />
      );
    },
  );
  MockNextImage.displayName = 'MockNextImage';

  return {
    __esModule: true,
    default: MockNextImage,
  };
});
  };
});

const defaultProps: OCRPreviewPaneProps = {
  images: [],
  currentPage: 1,
  isLoading: false,
  sections: [],
  selectedSectionId: null,
  onSectionSelect: jest.fn(),
  hasContent: true,
};

describe('OCRPreviewPane', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const loadImage = (container: HTMLElement, width = 200, height = 100) => {
    const img = container.querySelector('img') as HTMLImageElement | null;
    if (!img) {
      throw new Error('Expected preview image to exist');
    }

    Object.defineProperty(img, 'clientWidth', {
      configurable: true,
      value: width,
    });
    Object.defineProperty(img, 'clientHeight', {
      configurable: true,
      value: height,
    });
    Object.defineProperty(img, 'naturalWidth', {
      configurable: true,
      value: width,
    });
    Object.defineProperty(img, 'naturalHeight', {
      configurable: true,
      value: height,
    });
    img.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    fireEvent.load(img);

    return img;
  };

  it('renders the page number', () => {
    render(<OCRPreviewPane {...defaultProps} currentPage={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows "Loading..." when isLoading=true', () => {
    render(<OCRPreviewPane {...defaultProps} isLoading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty-state when hasContent=false', () => {
    render(<OCRPreviewPane {...defaultProps} hasContent={false} />);
    expect(screen.getByText(/Select a document section/i)).toBeInTheDocument();
  });

  it('renders image when images are provided', () => {
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      images: [{ id: 'img_1', base64: 'data:image/png;base64,abc' }],
    };
    render(<OCRPreviewPane {...props} />);
    expect(screen.getByAltText('Page 1')).toBeInTheDocument();
  });

  it('shows Draw Mode button', () => {
    render(<OCRPreviewPane {...defaultProps} />);
    expect(screen.getByTitle('Toggle Draw Mode')).toBeInTheDocument();
  });

  it('shows crosshair cursor on SVG after enabling draw mode', () => {
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      images: [{ id: 'img_1', base64: 'data:image/png;base64,abc' }],
    };
    const { container } = render(<OCRPreviewPane {...props} />);

    // Fire the image load event so SVG overlay renders
    const img = container.querySelector('img');
    if (img) fireEvent.load(img);

    // Enable draw mode
    const drawBtn = screen.getByTitle('Toggle Draw Mode');
    fireEvent.click(drawBtn);

    const svg = container.querySelector('svg[style]');
    expect(svg?.getAttribute('style')).toContain('crosshair');
  });

  it('calls onBBoxCreate with normalized coordinates after drawing a box', () => {
    const onBBoxCreate = jest.fn();
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      images: [{ id: 'img_1', base64: 'data:image/png;base64,abc' }],
      onBBoxCreate,
    };

    const { container } = render(<OCRPreviewPane {...props} />);
    loadImage(container, 200, 100);

    fireEvent.click(screen.getByTitle('Toggle Draw Mode'));

    const overlay = container.querySelector('svg[style]');
    if (!overlay) {
      throw new Error('Expected SVG overlay to exist');
    }

    fireEvent.mouseDown(overlay, { clientX: 20, clientY: 10 });
    fireEvent.mouseMove(overlay, { clientX: 120, clientY: 60 });
    fireEvent.mouseUp(overlay);

    expect(onBBoxCreate).toHaveBeenLastCalledWith([0.1, 0.1, 0.6, 0.6]);
  });

  it('moves a pending section bbox by mouse drag and saves it', () => {
    const onBBoxCreate = jest.fn();
    const onSaveBBox = jest.fn().mockResolvedValue(undefined);
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      images: [{ id: 'img_1', base64: 'data:image/png;base64,abc' }],
      selectedSectionId: 'section-1',
      pendingBBox: [0.1, 0.1, 0.5, 0.5],
      onBBoxCreate,
      onSaveBBox,
    };

    const { container } = render(<OCRPreviewPane {...props} />);
    loadImage(container, 200, 100);

    const overlay = container.querySelector('svg[style]');
    if (!overlay) {
      throw new Error('Expected SVG overlay to exist');
    }

    fireEvent.mouseMove(overlay, { clientX: 30, clientY: 20 });
    fireEvent.mouseDown(overlay, { clientX: 30, clientY: 20 });
    fireEvent.mouseMove(overlay, { clientX: 70, clientY: 50 });
    fireEvent.mouseUp(overlay);

    expect(onBBoxCreate).toHaveBeenLastCalledWith([0.3, 0.4, 0.7, 0.8]);

    fireEvent.click(screen.getByTitle('Save drawn bbox to this section'));
    expect(onSaveBBox).toHaveBeenCalledTimes(1);
  });

  it('shows Cancel/Save buttons when pendingPageBBoxEdit is set', () => {
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      images: [{ id: 'img_1', base64: 'data:image/png;base64,abc' }],
      pendingPageBBoxEdit: { imageId: 'img_1', bbox: [0.1, 0.1, 0.5, 0.5] },
    };
    render(<OCRPreviewPane {...props} />);
    expect(screen.getByTitle('Discard page bbox edit')).toBeInTheDocument();
    expect(
      screen.getByTitle('Save page bbox new position to database'),
    ).toBeInTheDocument();
  });

  it('Save Page BBox button is disabled and shows Saving… when isSavingPageBBox=true', () => {
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      images: [{ id: 'img_1', base64: 'data:image/png;base64,abc' }],
      pendingPageBBoxEdit: { imageId: 'img_1', bbox: [0.1, 0.1, 0.5, 0.5] },
      isSavingPageBBox: true,
    };
    render(<OCRPreviewPane {...props} />);
    const btn = document.querySelector(
      'button[title="Save page bbox new position to database"]',
    ) as HTMLButtonElement;
    expect(btn).toBeDisabled();
    expect(btn.textContent).toContain('Saving');
  });

  it('calls onSavePageBBoxEdit when Save Page BBox is clicked', () => {
    const onSavePageBBoxEdit = jest.fn();
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      images: [{ id: 'img_1', base64: 'data:image/png;base64,abc' }],
      pendingPageBBoxEdit: { imageId: 'img_1', bbox: [0.1, 0.1, 0.5, 0.5] },
      onSavePageBBoxEdit,
    };

    render(<OCRPreviewPane {...props} />);
    fireEvent.click(
      screen.getByTitle('Save page bbox new position to database'),
    );

    expect(onSavePageBBoxEdit).toHaveBeenCalledTimes(1);
  });

  it('moves a pending page bbox by mouse drag and saves it', () => {
    const onPageBBoxMove = jest.fn();
    const onSavePageBBoxEdit = jest.fn().mockResolvedValue(undefined);
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      images: [{ id: 'img_1', base64: 'data:image/png;base64,abc' }],
      pendingPageBBoxEdit: { imageId: 'img_1', bbox: [0.1, 0.1, 0.5, 0.5] },
      onPageBBoxMove,
      onSavePageBBoxEdit,
    };

    const { container } = render(<OCRPreviewPane {...props} />);
    loadImage(container, 200, 100);

    const overlay = container.querySelector('svg[style]');
    if (!overlay) {
      throw new Error('Expected SVG overlay to exist');
    }

    fireEvent.mouseMove(overlay, { clientX: 30, clientY: 20 });
    fireEvent.mouseDown(overlay, { clientX: 30, clientY: 20 });
    fireEvent.mouseMove(overlay, { clientX: 70, clientY: 50 });
    fireEvent.mouseUp(overlay);

    expect(onPageBBoxMove).toHaveBeenLastCalledWith(
      'img_1',
      [0.3, 0.4, 0.7, 0.8],
    );

    fireEvent.click(
      screen.getByTitle('Save page bbox new position to database'),
    );
    expect(onSavePageBBoxEdit).toHaveBeenCalledTimes(1);
  });

  it('moves a thin pending page bbox using padded hit area', () => {
    const onPageBBoxMove = jest.fn();
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      images: [{ id: 'img_1', base64: 'data:image/png;base64,abc' }],
      pendingPageBBoxEdit: {
        imageId: 'img_1',
        bbox: [0.02, 0.012, 0.374, 0.028],
      },
      onPageBBoxMove,
    };

    const { container } = render(<OCRPreviewPane {...props} />);
    loadImage(container, 200, 100);

    const overlay = container.querySelector('svg[style]');
    if (!overlay) {
      throw new Error('Expected SVG overlay to exist');
    }

    fireEvent.mouseMove(overlay, { clientX: 30, clientY: 1 });
    fireEvent.mouseDown(overlay, { clientX: 30, clientY: 1 });
    fireEvent.mouseMove(overlay, { clientX: 80, clientY: 20 });
    fireEvent.mouseUp(overlay);

    expect(onPageBBoxMove).toHaveBeenCalled();
  });

  it('renders resize handles for the pending page bbox', () => {
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      images: [{ id: 'img_1', base64: 'data:image/png;base64,abc' }],
      pendingPageBBoxEdit: { imageId: 'img_1', bbox: [0.1, 0.1, 0.5, 0.5] },
    };

    const { container } = render(<OCRPreviewPane {...props} />);
    loadImage(container);

    expect(
      container.querySelectorAll('circle[data-resize-handle]'),
    ).toHaveLength(4);
  });

  it('resizes a pending page bbox from the bottom-right handle', () => {
    const onPageBBoxMove = jest.fn();
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      images: [{ id: 'img_1', base64: 'data:image/png;base64,abc' }],
      pendingPageBBoxEdit: { imageId: 'img_1', bbox: [0.1, 0.1, 0.5, 0.5] },
      onPageBBoxMove,
    };

    const { container } = render(<OCRPreviewPane {...props} />);
    loadImage(container, 200, 100);

    const overlay = container.querySelector('svg[style]');
    const resizeHandle = container.querySelector(
      'circle[data-resize-handle="se"]',
    );

    if (!overlay || !resizeHandle) {
      throw new Error('Expected resize handle and overlay to exist');
    }

    fireEvent.mouseDown(resizeHandle, { clientX: 100, clientY: 50 });
    fireEvent.mouseMove(overlay, { clientX: 140, clientY: 70 });
    fireEvent.mouseUp(overlay);

    expect(onPageBBoxMove).toHaveBeenLastCalledWith(
      'img_1',
      [0.1, 0.1, 0.7, 0.7],
    );
  });

  it('renders the edited page bbox overlay and hides the original green bbox', () => {
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      images: [{ id: 'img_1', base64: 'data:image/png;base64,abc' }],
      pageBBoxes: [
        { image_id: 'img_1', bbox: [0.1, 0.1, 0.5, 0.5], isNormalized: true },
      ],
      pendingPageBBoxEdit: { imageId: 'img_1', bbox: [0.2, 0.2, 0.6, 0.6] },
    };

    const { container } = render(<OCRPreviewPane {...props} />);
    loadImage(container);

    expect(screen.getByText('Editing:')).toBeInTheDocument();
    expect(
      container.querySelector('rect[stroke="#a855f7"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('rect[stroke="#16a34a"]'),
    ).not.toBeInTheDocument();
  });

  it('renders pending section bbox overlay and disables save when no section is selected', () => {
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      images: [{ id: 'img_1', base64: 'data:image/png;base64,abc' }],
      pendingBBox: [0.1, 0.1, 0.5, 0.5],
    };

    const { container } = render(<OCRPreviewPane {...props} />);
    loadImage(container);

    const saveButton = screen.getByTitle('Select a section to save BBox');
    expect(saveButton).toBeDisabled();
    expect(
      container.querySelector('rect[stroke="orange"]'),
    ).toBeInTheDocument();
  });

  it('calls onPageBBoxSelect when a page bbox rect is clicked', () => {
    const onPageBBoxSelect = jest.fn();
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      images: [{ id: 'img_1', base64: 'data:image/png;base64,abc' }],
      pageBBoxes: [
        { image_id: 'img_1', bbox: [0.1, 0.1, 0.5, 0.5], isNormalized: true },
      ],
      onPageBBoxSelect,
    };
    const { container } = render(<OCRPreviewPane {...props} />);

    const img = container.querySelector('img');
    if (img) fireEvent.load(img);

    // The green bbox rect for img_1 should be present
    const rect = container.querySelector('rect');
    if (rect) fireEvent.click(rect);

    expect(onPageBBoxSelect).toHaveBeenCalledWith('img_1');
  });

  it('Cancel button calls onClearPageBBoxEdit', () => {
    const onClearPageBBoxEdit = jest.fn();
    const props: OCRPreviewPaneProps = {
      ...defaultProps,
      pendingPageBBoxEdit: { imageId: 'img_1', bbox: [0.1, 0.1, 0.5, 0.5] },
      onClearPageBBoxEdit,
    };
    render(<OCRPreviewPane {...props} />);
    fireEvent.click(screen.getByTitle('Discard page bbox edit'));
    expect(onClearPageBBoxEdit).toHaveBeenCalled();
  });
});
