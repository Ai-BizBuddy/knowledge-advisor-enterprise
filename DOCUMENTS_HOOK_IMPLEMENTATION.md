# useDocuments Hook Implementation

## Overview

I've implemented a comprehensive `useDocuments` hook with full CRUD operations and pagination support, similar to the existing `KnowledgeBaseService` pattern. This implementation provides document management functionality for knowledge bases with proper TypeScript support and error handling.

## Implementation Details

### 1. Enhanced DocumentService (`services/DocumentService/index.ts`)

**Key Features:**

- ✅ **Pagination Support**: Implemented `getDocumentsByKnowledgeBase()` with pagination options
- ✅ **Search Functionality**: Added `searchDocuments()` method with query filtering
- ✅ **CRUD Operations**: Full Create, Read, Update, Delete operations
- ✅ **Access Control**: Ensures users can only access documents from their own knowledge bases
- ✅ **Error Handling**: Comprehensive error handling with detailed logging
- ✅ **Backward Compatibility**: Maintained legacy methods with deprecation warnings

**New Methods:**

```typescript
// Paginated document retrieval with filters
getDocumentsByKnowledgeBase(knowledgeBaseId, paginationOptions, filters?)

// Search documents within a knowledge base
searchDocuments(knowledgeBaseId, query, paginationOptions)

// Get specific document with access control
getDocument(id, knowledgeBaseId?)

// Create document with validation
createDocument(input: CreateDocumentInput)

// Update document with proper typing
updateDocument(id, input: UpdateDocumentInput)

// Delete document with access control
deleteDocument(id)
```

### 2. useDocuments Hook (`hooks/useDocuments.tsx`)

**Features:**

- ✅ **State Management**: Documents, loading, error, pagination state
- ✅ **CRUD Operations**: Complete document lifecycle management
- ✅ **Search & Filtering**: Real-time search and status/type filtering
- ✅ **Pagination**: Full pagination support with configurable items per page
- ✅ **Batch Operations**: Batch update and delete functionality
- ✅ **Auto-loading**: Automatic document loading with dependency management
- ✅ **Error Handling**: Comprehensive error management with user feedback

**Hook Interface:**

```typescript
interface UseDocumentsReturn {
  // State
  documents: Document[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  searchTerm: string;
  selectedStatus: string;
  selectedType: string;

  // CRUD Operations
  loadDocuments: (page?, forceRefresh?) => Promise<void>;
  createDocument: (data: CreateDocumentInput) => Promise<Document>;
  updateDocument: (id: string, data: UpdateDocumentInput) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;

  // Search & Filter
  searchDocuments: (query: string) => Promise<void>;
  filterByStatus: (status: string) => Promise<Document[]>;
  filterByType: (type: string) => Promise<Document[]>;

  // Batch Operations
  batchUpdate: (ids: string[], updates) => Promise<Document[]>;
  batchDelete: (ids: string[]) => Promise<void>;

  // Event Handlers
  handlePageChange: (page: number) => void;
  handleDocumentClick: (id: string) => void;
  handleDocumentDelete: (id: string) => void;

  // Utilities
  refresh: () => Promise<void>;
  clearError: () => void;
}
```

### 3. Enhanced Interfaces (`interfaces/Project.ts`)

**Updated:**

- ✅ Added `status?` field to `CreateDocumentInput`
- ✅ Maintained all existing interfaces
- ✅ Proper TypeScript typing throughout

### 4. Service Integration (`services/index.ts`)

**Added:**

- ✅ Exported `documentService` singleton instance
- ✅ Follows same pattern as `knowledgeBaseService`

## Usage Examples

### Basic Usage

```typescript
import { useDocuments } from "@/hooks";

function DocumentsPage({ knowledgeBaseId }) {
  const {
    documents,
    loading,
    error,
    loadDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    searchDocuments,
  } = useDocuments({ knowledgeBaseId });

  // Documents are automatically loaded
  // All CRUD operations are available
}
```

### Advanced Usage with Filters

```typescript
const {
  documents,
  currentPage,
  totalPages,
  searchTerm,
  selectedStatus,
  handleStatusChange,
  handlePageChange,
  setSearchTerm,
} = useDocuments({ knowledgeBaseId });

// Filter by status
handleStatusChange("synced");

// Search documents
setSearchTerm("contract");

// Navigate pages
handlePageChange(2);
```

### CRUD Operations

```typescript
// Create document
await createDocument({
  name: "New Document",
  type: "pdf",
  project_id: knowledgeBaseId,
  path: "/documents/new.pdf",
  url: "https://example.com/new.pdf",
});

// Update document
await updateDocument(documentId, {
  status: "synced",
  rag_status: "synced",
});

// Delete document
await deleteDocument(documentId);

// Batch operations
await batchUpdate(["id1", "id2"], { status: "synced" });
await batchDelete(["id1", "id2"]);
```

## Integration with Knowledge Base Pages

The hook is designed to integrate seamlessly with knowledge base detail pages:

```typescript
// In knowledge-base/[id]/page.tsx
function KnowledgeBasePage({ params }) {
  const { documents, loading } = useDocuments({
    knowledgeBaseId: params.id
  });

  return (
    <div>
      <h1>Knowledge Base Documents</h1>
      {/* Document management UI */}
    </div>
  );
}
```

## Key Benefits

1. **Consistent Architecture**: Follows the same patterns as `useKnowledgeBase`
2. **Type Safety**: Full TypeScript support throughout
3. **Performance**: Optimized with React hooks best practices
4. **Scalability**: Pagination support for large document sets
5. **User Experience**: Real-time search and filtering
6. **Maintainability**: Clean separation of concerns and comprehensive error handling

## Database Schema Requirements

The implementation assumes the following Supabase table structure:

```sql
-- documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'uploaded',
  project_id UUID REFERENCES knowledge_base(id),
  chunk_count INTEGER DEFAULT 0,
  file_size BIGINT,
  mime_type TEXT,
  path TEXT NOT NULL,
  url TEXT NOT NULL,
  rag_status TEXT DEFAULT 'not_synced',
  last_rag_sync TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- knowledge_base table (for reference)
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Files Modified/Created

1. **Enhanced**: `services/DocumentService/index.ts` - Added pagination and CRUD methods
2. **Enhanced**: `hooks/useDocuments.tsx` - Complete rewrite with full functionality
3. **Enhanced**: `interfaces/Project.ts` - Added status field to CreateDocumentInput
4. **Enhanced**: `services/index.ts` - Added documentService export
5. **Created**: `examples/useDocuments-example.tsx` - Usage example component

The implementation is now ready for use and follows all the patterns established by the existing `KnowledgeBaseService` architecture.
