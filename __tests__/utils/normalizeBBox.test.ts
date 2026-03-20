import {
  normalizeBBox,
  normalizePageBBox,
  getBBoxFormat,
  toX1Y1X2Y2,
  normalizeImageId,
  type BBoxEntry,
} from '@/utils/normalizeBBox';

describe('normalizeBBox', () => {
  it('returns null for null input', () => {
    expect(normalizeBBox(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(normalizeBBox(undefined)).toBeNull();
  });

  it('returns null for empty array', () => {
    expect(normalizeBBox([])).toBeNull();
  });

  it('returns null for invalid JSON string', () => {
    expect(normalizeBBox('not-json')).toBeNull();
  });

  it('returns flat array as-is when given a flat number array', () => {
    expect(normalizeBBox([10, 20, 100, 200])).toEqual([10, 20, 100, 200]);
  });

  it('extracts bbox from DB object format (BBoxEntry array)', () => {
    const entries: BBoxEntry[] = [
      { image_id: 'img_1', bbox: [0.1, 0.2, 0.5, 0.8] },
    ];
    expect(normalizeBBox(entries)).toEqual([0.1, 0.2, 0.5, 0.8]);
  });

  it('parses a JSON string containing a flat array', () => {
    expect(normalizeBBox('[10, 20, 100, 200]')).toEqual([10, 20, 100, 200]);
  });

  it('parses a JSON string containing BBoxEntry array and extracts first bbox', () => {
    const json = JSON.stringify([{ image_id: 'img_1', bbox: [0.1, 0.2, 0.5, 0.8] }]);
    expect(normalizeBBox(json)).toEqual([0.1, 0.2, 0.5, 0.8]);
  });
});

describe('normalizePageBBox', () => {
  it('returns empty array for null input', () => {
    expect(normalizePageBBox(null)).toEqual([]);
  });

  it('returns empty array for undefined input', () => {
    expect(normalizePageBBox(undefined)).toEqual([]);
  });

  it('returns empty array for empty array', () => {
    expect(normalizePageBBox([])).toEqual([]);
  });

  it('returns empty array for invalid JSON string', () => {
    expect(normalizePageBBox('bad-json')).toEqual([]);
  });

  it('tags normalized (0–1) values as isNormalized=true', () => {
    const entries: BBoxEntry[] = [
      { image_id: 'img_1', bbox: [0.1, 0.2, 0.5, 0.8] },
    ];
    const result = normalizePageBBox(entries);
    expect(result).toHaveLength(1);
    expect(result[0].isNormalized).toBe(true);
    expect(result[0].image_id).toBe('img_1');
    expect(result[0].bbox).toEqual([0.1, 0.2, 0.5, 0.8]);
  });

  it('tags absolute-pixel values as isNormalized=false', () => {
    const entries: BBoxEntry[] = [
      { image_id: 'img_2', bbox: [50, 100, 300, 400] },
    ];
    const result = normalizePageBBox(entries);
    expect(result).toHaveLength(1);
    expect(result[0].isNormalized).toBe(false);
  });

  it('filters out entries with fewer than 4 bbox values', () => {
    const entries = [
      { image_id: 'img_1', bbox: [0.1, 0.2] },
    ] as unknown as BBoxEntry[];
    expect(normalizePageBBox(entries)).toEqual([]);
  });

  it('parses a JSON string and normalizes entries', () => {
    const json = JSON.stringify([{ image_id: 'img_1', bbox: [0.1, 0.2, 0.5, 0.8] }]);
    const result = normalizePageBBox(json);
    expect(result).toHaveLength(1);
    expect(result[0].isNormalized).toBe(true);
  });
});

describe('getBBoxFormat', () => {
  it('returns x1y1x2y2 for canonical format', () => {
    expect(getBBoxFormat([10, 20, 100, 200])).toBe('x1y1x2y2');
  });

  it('returns xywh when x2 < x1 (impossible in x1y1x2y2)', () => {
    // x=100, y=20, w=50, h=80 → w(50) < x(100), so detected as xywh
    expect(getBBoxFormat([100, 20, 50, 80])).toBe('xywh');
  });

  it('returns xywh when y2 < y1 (impossible in x1y1x2y2)', () => {
    // x=10, y=200, w=50, h=50 → h(50) < y(200), so detected as xywh
    expect(getBBoxFormat([10, 200, 50, 50])).toBe('xywh');
  });

  it('returns x1y1x2y2 for array shorter than 4', () => {
    expect(getBBoxFormat([10, 20])).toBe('x1y1x2y2');
  });
});

describe('toX1Y1X2Y2', () => {
  it('returns xywh converted to x1y1x2y2', () => {
    // [x=10, y=20, w=90, h=80] → [10, 20, 100, 100]
    expect(toX1Y1X2Y2([10, 20, 90, 80], 'xywh')).toEqual([10, 20, 100, 100]);
  });

  it('returns x1y1x2y2 unchanged', () => {
    expect(toX1Y1X2Y2([10, 20, 100, 200], 'x1y1x2y2')).toEqual([10, 20, 100, 200]);
  });

  it('auto-detects xywh format when no format is given', () => {
    // [x=100, y=20, w=50, h=30] → w < x so auto-detected as xywh → [100, 20, 150, 50]
    expect(toX1Y1X2Y2([100, 20, 50, 30])).toEqual([100, 20, 150, 50]);
  });

  it('auto-detects x1y1x2y2 format when no format is given', () => {
    expect(toX1Y1X2Y2([10, 20, 100, 200])).toEqual([10, 20, 100, 200]);
  });
});

describe('normalizeImageId', () => {
  it('strips image_ prefix', () => {
    expect(normalizeImageId('image_1_logo')).toBe('1_logo');
  });

  it('strips img_ prefix', () => {
    expect(normalizeImageId('img_2_chart')).toBe('2_chart');
  });

  it('strips figure_ prefix', () => {
    expect(normalizeImageId('figure_3_diagram')).toBe('3_diagram');
  });

  it('strips figure- prefix (hyphen separator)', () => {
    expect(normalizeImageId('figure-4_diagram')).toBe('4_diagram');
  });

  it('returns the id unchanged when no known prefix is present', () => {
    expect(normalizeImageId('photo_5_landscape')).toBe('photo_5_landscape');
  });

  it('only strips the first matching prefix', () => {
    expect(normalizeImageId('img_img_double')).toBe('img_double');
  });
});
