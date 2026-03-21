---
name: knowledge-base-rag
description: "Use when: building RAG (retrieval-augmented generation) features, document ingestion/processing, knowledge base search, OCR integration, document chunking/embedding, or connecting to the Ingress service."
---

# Knowledge Base & RAG Feature Development

You are a developer extending the RAG pipeline in this app. The system connects a Next.js CSR frontend to a .NET Ingress backend service that handles OCR → chunking → embedding → Supabase pgvector storage.

**Architecture**: Browser → Next.js (Frontend) → Ingress Service (OCR/Embed) → Supabase (pgvector + Storage)

---

## System Overview

```
Document Upload (Storage)
  ↓
Ingress Service (NEXT_PUBLIC_INGRESS_SERVICE)
  ├── OCR: Google Vision / Mistral / LocalOCR
  ├── Chunking → document_section table (with vector embeddings)
  ├── Page images → Supabase Storage
  └── Page data → document_page table (content, base64_image, bbox)
  ↓
Search: pgvector similarity on document_section_embeddings
```

### Key Tables
| Table | Purpose |
|-------|---------|
| `projects` | Knowledge bases |
| `document` / `document_view` | Files per KB |
| `document_section` | Chunks with vector embeddings |
| `document_page` | Per-page OCR content + images |
| `sync_history` | Ingress job audit trail |

---

## Step 0: Decide What You're Building

| Task | Go to |
|------|-------|
| Upload a document and trigger ingestion | Step 1 |
| Search within a knowledge base | Step 2 |
| Display OCR'd pages / document viewer | Step 3 |
| Connect a new external AI/search service | Step 4 |
| Monitor ingestion status | Step 5 |

---

## Step 1: Document Upload & Ingestion

### Upload to Storage
```typescript
// services/StorageService/ — use existing StorageService
import { storageService } from '@/services';

const result = await storageService.uploadDocument(file, knowledgeBaseId);
// Returns { success, data: { path, url } }
```

### Trigger Ingress
```typescript
// services/IngressService/index.ts pattern
import { runIngress } from '@/services/IngressService';
import type { IngressRequest } from '@/interfaces/Ingress';

const token = await getJWTToken(); // from useAuth / getAuthSession

const request: IngressRequest = {
  document_id: documentId,
  knowledge_base_id: knowledgeBaseId,
  mode: 'Full',         // 'Full' | 'OcrOnly' | 'EmbeddingOnly' | 'PageImagesOnly'
  pipeline: 'default',
  UseAdvancedChunking: false,
};

const result = await runIngress(token, request);
```

**Ingress modes**:
- `Full` — OCR + context save + embedding (standard ingestion)
- `OcrOnly` — extract text only, no embeddings
- `EmbeddingOnly` — re-embed existing content (skip OCR)
- `PageImagesOnly` — render page images only

### Poll Status
```typescript
// Document status progresses: 'queued' → 'processing' → 'ready' | 'error'
// Use useDocuments hook with polling or subscribe to realtime
const { documents } = useDocuments({ knowledgeBaseId, autoLoad: true });

// Or direct Supabase realtime
const supabase = createClientTable();
supabase
  .channel(`document:${documentId}`)
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'document', filter: `id=eq.${documentId}` },
    (payload) => { /* handle status change */ }
  )
  .subscribe();
```

---

## Step 2: Search / RAG Query

### Semantic Search via AI Service
```typescript
// pattern from services/DocumentSearchService
const BASE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL;

const response = await fetch(`${BASE_URL}/search`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    query: userQuery,
    knowledge_base_id: kbId,
    top_k: 5,
  }),
});
```

### Supabase Direct Search (pgvector RPC)
```typescript
const supabase = createClientTable();

const { data, error } = await supabase.rpc('match_document_sections', {
  query_embedding: embeddingVector,   // float8[]
  match_threshold: 0.78,
  match_count: 10,
  knowledge_base_id: kbId,
});
```

### Chat via ADK (existing pattern)
Use `useAdkChat` hook from `hooks/useAdkChat.tsx` — it handles session management, streaming responses, and history.

---

## Step 3: Document Viewer / OCR Pages

### Fetch Page Data
```typescript
// services/DocumentPageService
import { documentPageService } from '@/services';

// Get all pages for a document
const result = await documentPageService.getDocumentPages(documentId);
// Returns: { id, document_id, page_number, content, base64_image, bbox }[]

// Get specific page
const page = await documentPageService.getDocumentPage(documentId, pageNumber);
```

### Display Page Image
```typescript
// base64_image is a data URI or raw base64 string
<img
  src={page.base64_image.startsWith('data:') ? page.base64_image : `data:image/png;base64,${page.base64_image}`}
  alt={`Page ${page.page_number}`}
  className="w-full rounded-lg"
/>
```

### BBox Overlay (for OCR highlights)
```typescript
// bbox format: [{ image_id: string, bbox: [x1, y1, x2, y2] }]
// Use documentPageViewer component: components/documentPageViewer/
// Or ocrViewer: components/ocrViewer/
```

Prefer the existing `components/documentPageViewer/` and `components/ocrViewer/` over building new viewers.

---

## Step 4: Adding a New External AI/Search Service

1. **Interface first**: Add request/response types to `interfaces/` (no `any`)
2. **Utility function**: Use `BaseFetchClient` from `utils/fetchClient` for HTTP
3. **Service module**: Create `services/NewAiService/index.ts` following the `IngressService` functional pattern (plain functions, no class needed for external API calls)
4. **Environment variable**: Add to `.env.local` as `NEXT_PUBLIC_<SERVICE_NAME>_URL`
5. **Hook**: Wrap in a custom hook with `loading`, `error`, `data` state

```typescript
// services/NewAiService/index.ts
const BASE_URL = process.env.NEXT_PUBLIC_NEW_AI_SERVICE || '';

export async function queryNewAi(
  token: string,
  payload: NewAiRequest
): Promise<TypedResponse<NewAiResponse>> {
  try {
    const res = await fetch(`${BASE_URL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json() as NewAiResponse;
    if (!res.ok) return { success: false, error: (data as { error?: string }).error ?? `Status ${res.status}` };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
```

---

## Step 5: Monitor Ingestion Status

```typescript
// hooks/useDocumentsManagement.tsx has syncDocument / pollStatus patterns
// services/DocumentIngestionService has status tracking

// Quick status display based on document.status:
const STATUS_MAP = {
  queued:     { label: 'Queued',     color: 'yellow' },
  processing: { label: 'Processing', color: 'blue'   },
  ready:      { label: 'Ready',      color: 'green'  },
  error:      { label: 'Error',      color: 'red'    },
} as const;
```

Check `constants/statuses.ts` for existing status constants before adding new ones.

---

## RAG Feature Checklist

- [ ] Document upload handles large files (check max size in StorageService)
- [ ] Ingress token is obtained from JWT (not stored in state)
- [ ] Status polling doesn't start before document is in `processing` state
- [ ] Page images load lazily (don't load all pages at once)
- [ ] Search results include source attribution (document name, page number)
- [ ] Error states shown for failed ingestion with clear user message
- [ ] Build passes: `npm run build`

---

## Common Pitfalls

| Pitfall | Fix |
|---------|-----|
| JWT expired during long ingestion | Re-fetch token per request, not cached |
| base64_image missing `data:` prefix | Prepend `data:image/png;base64,` if not present |
| pgvector `match_document_sections` returns no results | Check `match_threshold` — lower to 0.5 for debugging |
| File too large for storage | Check `NEXT_PUBLIC_MAX_FILE_SIZE` / StorageService limits |
| Ingress service 401 | Supabase JWT must be passed as Bearer token |
| `document_page` table missing image | Ingestion ran with wrong mode — use `Full` or `PageImagesOnly` |
