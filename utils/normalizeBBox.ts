// Utility functions for normalizing bounding boxes.
//
// Canonical format (used by downstream rendering):
//   [x1, y1, x2, y2]  -> top-left (x1, y1), bottom-right (x2, y2)
//
// Legacy flat format (still accepted as input for backwards compatibility):
//   [x, y, w, h]      -> top-left (x, y), width w, height h
//
// The functions in this module ALWAYS return bounding boxes in the
// canonical [x1, y1, x2, y2] format to avoid width/height being mistaken
// for absolute coordinates.

export type BBox = [number, number, number, number];

export type BBoxFormat = 'x1y1x2y2' | 'xywh';

/**
 * Convert a bounding box from a known input format to the canonical
 * [x1, y1, x2, y2] representation.
 *
 * @param bbox   The input bounding box as a 4-tuple.
 * @param format The format of the input bbox.
 *               - 'x1y1x2y2' (default): [x1, y1, x2, y2]
 *               - 'xywh'           : [x, y, w, h]
 * @returns The bounding box normalized to [x1, y1, x2, y2].
 */
/**
 * Detects the likely format of a 4-element bbox array.
 *
 * Heuristic:
 * - If `bbox[2] < bbox[0]` or `bbox[3] < bbox[1]`, it cannot be `x1y1x2y2`
 *   (x2 must be >= x1, y2 must be >= y1), so it is likely `xywh`.
 * - Otherwise default to `x1y1x2y2` (the canonical backend convention).
 */
function getBBoxFormat(bbox: number[]): 'x1y1x2y2' | 'xywh' {
  if (bbox.length < 4) return 'x1y1x2y2';
  // In x1y1x2y2 format, x2 >= x1 and y2 >= y1
  if (bbox[2] < bbox[0] || bbox[3] < bbox[1]) return 'xywh';
  return 'x1y1x2y2';
}

/**
 * Convert a bounding box from a known input format to the canonical
 * [x1, y1, x2, y2] representation.
 *
 * @param bbox   The input bounding box as a 4-tuple.
 * @param format The format of the input bbox.
 *               - 'x1y1x2y2' (default): [x1, y1, x2, y2]
 *               - 'xywh'           : [x, y, w, h]
 * @returns The bounding box normalized to [x1, y1, x2, y2].
 */
export function toX1Y1X2Y2(bbox: number[], format?: 'x1y1x2y2' | 'xywh'): number[] {
  const [a, b, c, d] = bbox;
  const fmt = format ?? getBBoxFormat(bbox);

  if (fmt === 'xywh') {
    const x1 = a;
    const y1 = b;
    const w = c;
    const h = d;

    const x2 = x1 + w;
    const y2 = y1 + h;

    return [x1, y1, x2, y2];
  }

  // Already in canonical [x1, y1, x2, y2] format.
  return (bbox.length === 4 ? [a, b, c, d] : bbox) as number[];
}

/**
 * Canonical BBox format used throughout the application: **`[x1, y1, x2, y2]`**
 *
 * - `x1, y1` = top-left corner
 * - `x2, y2` = bottom-right corner
 * - Values are normalised 0–1 (fraction of page dimensions) when from OCR,
 *   or absolute pixels when from manual annotation on a specific image.
 *
 * DB column `document_page.bbox` stores:
 *   `[{ "image_id": "img_1", "bbox": [x1, y1, x2, y2] }, ...]`
 *
 * Section metadata `images[].bbox` also uses `[x1, y1, x2, y2]`.
 */
export interface BBoxEntry {
  image_id: string;
  bbox: number[];
  /** Explicit format tag. Defaults to `'x1y1x2y2'` when absent. */
  format?: 'x1y1x2y2' | 'xywh';
}

/** Normalised page-level bbox entry with detection of coordinate system. */
export interface PageBBoxEntry {
  image_id: string;
  bbox: number[];
  /** True when all four values are in 0-1 range; false when absolute pixels. */
  isNormalized: boolean;
}

/**
 * Normalises a bbox value from any known storage format to a flat `number[4]` array.
 *
 * Supported inputs:
 * - `null` / `undefined`  → returns `null`
 * - `[x, y, w, h]`        → old flat format, returned as-is
 * - `[{ image_id, bbox }]`→ new DB object format, returns the first entry's bbox
 */
export function normalizeBBox(
  raw: number[] | BBoxEntry[] | string | null | undefined,
  format: BBoxFormat = 'x1y1x2y2',
): number[] | null {
  if (!raw) return null;

  // Supabase sometimes returns JSONB columns as a JSON string — parse if needed
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) return null;
  const first = parsed[0];
  if (typeof first === 'object' && first !== null && 'bbox' in first) {
    return toX1Y1X2Y2((first as BBoxEntry).bbox, (first as BBoxEntry).format || format);
  }

  const bbox = parsed as number[];
  return toX1Y1X2Y2(bbox, format);
}


/**
 * Normalises the page-level `document_page.bbox` column.
 *
 * Input format from DB: `[{ image_id: "img_1", bbox: [x1, y1, x2, y2] }, ...]`
 * The column is JSONB but Supabase may return it as a JSON string — handled here.
 * Values may be normalised (0-1) or absolute pixels — auto-detected via ≤1.01 heuristic.
 *
 * Returns `PageBBoxEntry[]` with each entry tagged `isNormalized`.
 */
export function normalizePageBBox(
  raw: BBoxEntry[] | string | null | undefined,
): PageBBoxEntry[] {
  if (!raw) return [];

  // Supabase sometimes returns JSONB columns as a JSON string — parse if needed
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed) || parsed.length === 0) return [];

  return (parsed as BBoxEntry[])
    .filter(
      (entry): entry is BBoxEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        'bbox' in entry &&
        Array.isArray(entry.bbox) &&
        entry.bbox.length >= 4,
    )
    .map((entry) => ({
      image_id: entry.image_id,
      bbox: entry.bbox,
      isNormalized: entry.bbox.every((v) => v <= 1.01),
    }));
}

/**
 * Normalises an image ID for matching between OCR text references and DB bbox entries.

 *
 * OCR text may embed `![alt](image_1_logo)` while the DB bbox uses `img_1_logo`.
 * This strips common prefixes (`image_`, `img_`, `figure_`) to get the comparable suffix.
 */
export function normalizeImageId(id: string): string {
  return id.replace(/^(image|img|figure)[_-]/, '');
}
