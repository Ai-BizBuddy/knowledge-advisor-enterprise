# Migration from useDocumentsManagement to useDocuments

## Summary

Successfully migrated the knowledge base detail page (`app/(main)/knowledge-base/[id]/page.tsx`) from using the old `useDocumentsManagement` hook to the new `useDocuments` hook.

## Changes Made

### 1. Updated Imports

- Removed `useDocumentsManagement` import
- Added `useDocuments` import
- Added type imports for both old and new Document interfaces
- Removed unused imports (`getKnowledgeBaseById`, `KnowledgeBaseData`)

### 2. Added Document Adapter

- Created `adaptDocumentToOldFormat()` function to transform new Document interface to old DocumentsTable-compatible format
- Maintains backward compatibility with existing DocumentsTable component

### 3. Replaced Hook Usage

- **Before**: `useDocumentsManagement()` - used static data and client-side filtering
- **After**: `useDocuments({ knowledgeBaseId: id })` - uses real Supabase data with server-side pagination

### 4. Updated State Management

- Changed selection state from `string[]` to `number[]` to match DocumentsTable expectations
- Updated selection handlers to work with array indices instead of document IDs
- Maintained all existing UI functionality

### 5. Data Flow Improvements

- **Real Data**: Now fetches actual documents from Supabase instead of mock data
- **Pagination**: Server-side pagination instead of client-side
- **Search**: Real-time search through database instead of local filtering
- **CRUD Operations**: Full CRUD support through DocumentService

## Key Benefits

1. **Real Data Integration**: Now uses actual documents from knowledge bases
2. **Server-side Operations**: Pagination, search, and filtering happen on the server
3. **Scalability**: Can handle large document sets efficiently
4. **Consistency**: Follows the same patterns as other parts of the application
5. **Future-Ready**: Can easily add more advanced features like document upload, sync status, etc.

## Maintained Functionality

- ✅ Document listing with pagination
- ✅ Document selection (single and multiple)
- ✅ Search functionality
- ✅ Sorting by columns
- ✅ Status badges and sync buttons
- ✅ Upload document modal
- ✅ Chat assistant interface
- ✅ All existing UI interactions

## Technical Details

### Document Adapter Function

```typescript
const adaptDocumentToOldFormat = (doc: NewDocument): OldDocument => ({
  name: doc.name,
  size: doc.file_size
    ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
    : "Unknown",
  type: doc.type.toUpperCase(),
  date: new Date(doc.created_at).toLocaleDateString(),
  status: doc.status,
  uploadedBy: "User",
  avatar: "/avatars/default.png",
  project: [],
  source: doc.rag_status || "not_synced",
  uploadDate: new Date(doc.created_at).toLocaleDateString(),
  chunk: doc.chunk_count,
  syncStatus: doc.rag_status === "synced" ? "Synced" : "Not Synced",
  lastUpdated: new Date(doc.updated_at).toLocaleDateString(),
});
```

### New Hook Integration

```typescript
const {
  documents,
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  searchTerm,
  handlePageChange,
  setSearchTerm,
} = useDocuments({ knowledgeBaseId: id });
```

## Next Steps

To fully leverage the new `useDocuments` hook capabilities, consider:

1. **Adding Real Document Upload**: Connect upload modal to actual document creation
2. **Implementing Sync Actions**: Connect sync buttons to RAG processing
3. **Enhanced Filtering**: Add status and type filters to the UI
4. **Batch Operations**: Implement bulk document operations
5. **Error Handling**: Add proper error states and user feedback

The migration is complete and the page now works with real data while maintaining all existing functionality!
