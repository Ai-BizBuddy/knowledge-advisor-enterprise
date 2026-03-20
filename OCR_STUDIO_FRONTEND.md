# OCR Studio — Frontend Implementation Guide

This document is a complete prompt and specification for building the OCR Studio UI. It covers all API contracts, data shapes, and UI behaviour needed to implement the three core features:

1. **Page viewer** — browse a document page-by-page with the page image
2. **Bounding-box overlay** — draw detected image regions on top of each page
3. **Section editor** — read and correct the OCR'd text chunks directly in the browser

---

## Authentication

Every request requires a Supabase JWT in the `Authorization` header:

```
Authorization: Bearer <supabase_jwt>
```

Missing or invalid tokens receive `401 Unauthorized`.

---

## Base URL

```
https://<your-ingression-host>
```

---

## 1. Load a Document (full data in one call)

```
GET /documents/{documentId}/full
Authorization: Bearer <token>
```

### Response `200 OK`

```jsonc
{
  "document": {
    "id": "3dd67bbc-7b29-44d1-968d-66e212ff6933",
    "name": "contract.pdf",
    "file_type": "pdf",
    "status": "Ready",              // Uploaded | Queued | Processing | Ready | Error
    "knowledge_base_id": "1876d5a8-e9be-491f-bcbd-e2ba2c9bbc93",
    "description": null,
    "chunk_count": 12,
    "page_count": 5,
    "file_size": 204800,
    "mime_type": "application/pdf",
    "url": "https://...",           // public storage URL (may be null)
    "created_at": "2026-03-01T10:00:00Z",
    "updated_at": "2026-03-01T10:05:00Z",
    "metadata": null,               // arbitrary JSON; may be null
    "error_message": null,          // populated when status == "Error"
    "last_rag_sync": "2026-03-01T10:05:00Z"
  },
  "pages": [                        // array of document_page rows, sorted by page_number
    {
      "id": "aaa...",
      "document_id": "3dd67...",
      "knowledge_base_id": "1876...",
      "page_number": 1,
      "page_count": 5,
      "content": "Full OCR text for page 1...",
      "base64_image": "<base64-encoded PNG string>",   // render as <img src="data:image/png;base64,...">
      "bbox": "[{\"image_id\":\"img-1\",\"bbox\":[0.12,0.08,0.55,0.42]},{\"image_id\":\"img-2\",\"bbox\":[0.60,0.10,0.95,0.35]}]",
      "created_at": "2026-03-01T10:00:00Z"
    }
    // ... more pages
  ],
  "sections": [                     // array of document_section rows (text chunks + embeddings)
    {
      "id": "bbb...",
      "content": "This agreement is entered into...",
      "metadata": {
        "document_id": "3dd67...",
        "file_name": "contract.pdf",
        "page": 1,
        "chunk_index": 1,
        "knowledge_base_id": "1876...",
        "images": [
          {
            "id": "img-1",
            "base64": "<base64 PNG>",
            "bbox": [0.12, 0.08, 0.55, 0.42]   // [x1, y1, x2, y2] normalized 0–1
          }
        ]
      },
      "embedding": null             // omit / ignore in the UI — very large vector
    }
  ]
}
```

> **Tip:** Call this once on page load, save response to state, and derive everything else (page list, section list, bbox list) client-side without extra requests.

Alternatively, fetch pages and sections independently:

| Endpoint | Returns |
|---|---|
| `GET /documents/{documentId}/pages` | `{ documentId, pages[] }` |
| `GET /documents/{documentId}/sections` | `{ documentId, sections[] }` |

---

## 2. Display Document Per Page

### Mapping the data

```ts
interface Page {
  id: string
  page_number: number     // 1-indexed
  page_count: number      // total pages in this document
  content: string         // full OCR text for this page
  base64_image: string | null   // PNG of the page
  bbox: string | null     // JSON string — parse it yourself (see below)
}
```

### Rendering the page image

```tsx
<img
  src={`data:image/png;base64,${page.base64_image}`}
  alt={`Page ${page.page_number}`}
  style={{ width: '100%' }}
/>
```

### Navigation

- Sort pages by `page_number` ascending.
- Keep a `currentPage` index in state (0-based index into the `pages` array).
- "Previous" / "Next" buttons increment/decrement `currentPage`.
- Show `{page.page_number} / {page.page_count}` as the progress indicator.

---

## 3. Display Bounding Boxes

The `bbox` field on each `page` is a **JSON string** — parse it on first use:

```ts
interface BBoxEntry {
  image_id: string
  bbox: [number, number, number, number]  // [x1, y1, x2, y2] normalized 0–1
}

const boxes: BBoxEntry[] = page.bbox ? JSON.parse(page.bbox) : []
```

The four numbers are fractions of the page image dimensions:

| Value | Meaning |
|---|---|
| `x1` | left edge ÷ page width |
| `y1` | top edge ÷ page height |
| `x2` | right edge ÷ page width |
| `y2` | bottom edge ÷ page height |

### SVG overlay approach (recommended)

Render the page image and an SVG overlay in a relative-positioned container so both are the same size:

```tsx
function PageViewer({ page }: { page: Page }) {
  const boxes: BBoxEntry[] = page.bbox ? JSON.parse(page.bbox) : []

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <img
        src={`data:image/png;base64,${page.base64_image}`}
        style={{ display: 'block', width: '100%' }}
      />
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
      >
        {boxes.map((b) => (
          <rect
            key={b.image_id}
            x={b.bbox[0]}
            y={b.bbox[1]}
            width={b.bbox[2] - b.bbox[0]}
            height={b.bbox[3] - b.bbox[1]}
            fill="rgba(255, 200, 0, 0.15)"
            stroke="#f59e0b"
            strokeWidth="0.003"
          />
        ))}
      </svg>
    </div>
  )
}
```

> Using `viewBox="0 0 1 1"` means the normalized coordinates map directly to SVG units — no manual scaling required.

### Highlighting a section's image in context

Each section in `metadata.images[]` carries the same bbox structure. When the user clicks a section, find its `image_id` in the current page's `boxes` array and highlight that rectangle (e.g. change stroke color to red).

---

## 4. Edit a Section (fix OCR text)

### Finding sections for a page

Filter the `sections` array by `metadata.page === currentPageNumber`:

```ts
const pageSections = sections.filter(
  (s) => s.metadata?.page === page.page_number
)
```

### Section list UI

For each section show:
- A read-only preview of `section.content` (truncated to ~120 chars)
- An "Edit" button that opens an inline editor (textarea)
- The `chunk_index` from metadata as a label (e.g. "Chunk 3")

### Save edited content

```
PATCH /documents/sections/{sectionId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Corrected OCR text goes here."
}
```

#### Response `200 OK`

```json
{
  "sectionId": "bbb...",
  "content": "Corrected OCR text goes here."
}
```

#### Error responses

| Status | Meaning |
|---|---|
| `400` | `sectionId` is empty or `content` is blank |
| `401` | Missing or invalid JWT |
| `404` | Section not found |
| `500` | Server error |

### UI pattern

```tsx
function SectionEditor({ section, token }: { section: Section; token: string }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(section.content)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const res = await fetch(`/documents/sections/${section.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: text }),
    })
    if (res.ok) {
      const data = await res.json()
      setText(data.content)
      setEditing(false)
    }
    setSaving(false)
  }

  return (
    <div className="section-card">
      <span className="chunk-label">Chunk {section.metadata?.chunk_index}</span>
      {editing ? (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} />
          <button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={() => { setText(section.content); setEditing(false) }}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <p>{text.slice(0, 120)}{text.length > 120 ? '…' : ''}</p>
          <button onClick={() => setEditing(true)}>Edit</button>
        </>
      )}
    </div>
  )
}
```

---

## 5. Suggested Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  contract.pdf                          Page 2 of 5  ◀  ▶   │
├──────────────────────────┬──────────────────────────────────┤
│                          │  Sections on this page           │
│   [Page image with       │  ┌─────────────────────────────┐ │
│    yellow bbox overlays] │  │ Chunk 1                     │ │
│                          │  │ "This agreement is entered…"│ │
│                          │  │                      [Edit] │ │
│                          │  └─────────────────────────────┘ │
│                          │  ┌─────────────────────────────┐ │
│                          │  │ Chunk 2                     │ │
│                          │  │ "…between Party A and Party…"│ │
│                          │  │                      [Edit] │ │
│                          │  └─────────────────────────────┘ │
└──────────────────────────┴──────────────────────────────────┘
```

- Left panel: page image + SVG bbox layer
- Right panel: section list filtered to current page, each expandable to an editable textarea
- Top bar: document name, page counter, prev/next buttons

---

## 6. API Summary

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/documents/{id}/full` | Load document + all pages + all sections |
| `GET` | `/documents/{id}/pages` | Load only pages |
| `GET` | `/documents/{id}/sections` | Load only sections |
| `GET` | `/ingress/{id}` | Load document metadata only |
| `PATCH` | `/documents/sections/{sectionId}` | Update section text content |
| `POST` | `/ingress/{id}` | Re-run full pipeline (always Full + Classic mode) |
| `POST` | `/ingress` | Queue document with custom mode/pipeline options |
| `POST` | `/page` | Manually insert a single page record |
| `POST` | `/admin/backfill-pages/all` | Backfill page images for all documents |
| `POST` | `/deep-search` | Semantic vector search across knowledge bases |

---

## 7. Re-process a Document

### Simple re-run (always Full pipeline)

If the user fixes sections and wants to regenerate embeddings from the corrected text, trigger a full pipeline re-run:

```
POST /ingress/{documentId}
Authorization: Bearer <token>
```

No request body required. Always executes `Classic` mode with the `Full` pipeline (page images + OCR + chunking + embedding).

Response `202 Accepted`:

```json
{
  "message": "Document processing job enqueued",
  "jobId": "abc-123",
  "documentId": "3dd67bbc-..."
}
```

Poll `GET /ingress/{documentId}` and watch `status` change from `Queued → Processing → Ready`.

---

### Advanced ingestion (custom options)

Use `POST /ingress` with a body to control chunking strategy, mode, and pipeline stages:

```
POST /ingress
Authorization: Bearer <token>
Content-Type: application/json

{
  "documentId": "3dd67bbc-7b29-44d1-968d-66e212ff6933",
  "useAdvancedChunking": true,
  "minTokens": 100,
  "targetTokens": 300,
  "maxTokens": 500,
  "mode": "Classic",
  "pipeline": "Full"
}
```

#### `mode` values

| Value | Meaning |
|---|---|
| `Classic` | Process document as a whole (default) |
| `PerPage` | Chunk and embed each page independently |

#### `pipeline` values

| Value | Meaning |
|---|---|
| `Full` | All stages: page images + OCR + chunking + embedding (default) |
| `OcrOnly` | Run OCR and store text; skip embedding |
| `ColPaliOnly` | Run ColPali vision stage only |
| `EmbeddingOnly` | Re-embed existing text chunks without re-OCRing |
| `PageImagesOnly` | Only generate and store page images |

Response `202 Accepted`:

```json
{
  "message": "Document received and queued for processing",
  "documentId": "3dd67bbc-...",
  "jobId": "abc-123"
}
```
