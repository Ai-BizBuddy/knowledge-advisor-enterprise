# Deep Search Components

This directory contains reusable components for the Deep Search functionality in the Knowledge Advisor application.

## Components Overview

### 1. LoadingStateCard

A skeleton loading component that displays animated placeholders while search results are being fetched.

**Props:**

- `count?: number` - Number of skeleton cards to display (default: 3)
- `className?: string` - Additional CSS classes

**Usage:**

```tsx
import { LoadingStateCard } from "@/components/deepSearch";

<LoadingStateCard count={5} className="my-4" />;
```

### 2. DocumentCard

A card component that displays individual document search results with file icons, metadata, and relevance scores.

**Props:**

- Extends `DocumentSearchResult` interface
- `onClick?: (document: DocumentSearchResult) => void` - Click handler
- `className?: string` - Additional CSS classes

**Usage:**

```tsx
import { DocumentCard } from "@/components/deepSearch";

<DocumentCard
  id="doc-1"
  title="Document Title"
  content="Document preview content..."
  fileType="pdf"
  fileSize="2.5 MB"
  uploadDate="2024-01-15"
  knowledgeName="Technical Docs"
  onClick={handleDocumentClick}
/>;
```

### 3. EmptyState

A component that displays empty states for different scenarios (initial state, no results).

**Props:**

- `type?: "no-results" | "initial"` - Type of empty state (default: "initial")
- `searchQuery?: string` - The search query (for no-results state)
- `className?: string` - Additional CSS classes

**Usage:**

```tsx
import { EmptyState } from "@/components/deepSearch";

// Initial state
<EmptyState type="initial" />

// No results state
<EmptyState type="no-results" searchQuery="AI guidelines" />
```

### 4. DeepSearchLayout

A comprehensive layout component that combines all search result states and automatically switches between them based on the current state.

**Props:**

- `searchQuery: string` - Current search query
- `searchResults: DocumentSearchResult[]` - Array of search results
- `loading: boolean` - Loading state
- `isSearching: boolean` - Whether a search is in progress
- `isNoResults: boolean` - Whether the search returned no results
- `onResultClick: (result: DocumentSearchResult) => void` - Result click handler
- `className?: string` - Additional CSS classes

**Usage:**

```tsx
import { DeepSearchLayout } from "@/components/deepSearch";

<DeepSearchLayout
  searchQuery={searchQuery}
  searchResults={searchResults}
  loading={loading}
  isSearching={isSearching}
  isNoResults={isNoResults}
  onResultClick={handleResultClick}
/>;
```

## Types

All components use shared TypeScript interfaces defined in `@/interfaces/DeepSearchTypes`:

```tsx
interface DocumentSearchResult {
  id: string;
  title: string;
  content: string;
  fileType: string;
  fileSize: string;
  uploadDate: string;
  knowledgeName?: string;
  fileUrl?: string;
}
```

## Features

- **Responsive Design**: All components are fully responsive and work on mobile and desktop
- **Dark Mode Support**: Components automatically adapt to light/dark themes
- **Accessibility**: Proper ARIA labels and keyboard navigation support
- **File Type Icons**: Automatic file type detection with appropriate icons (PDF, DOCX, PPTX)
- **Loading States**: Smooth skeleton animations during loading
- **Knowledge Base Integration**: Shows which knowledge base contains each document
- **Document Preview**: Iframe-based preview for PDFs and Office documents
- **Mini Preview**: Quick document preview with expand option
- **Full-Scale Preview**: Complete document viewer with download options

## Preview Features

### Document Preview System

The Deep Search components now include a comprehensive document preview system:

1. **Preview Button**: Each DocumentCard shows a preview button (eye icon) when `fileUrl` is available
2. **Mini Preview**: Clicking the preview button opens a smaller preview modal
3. **Full-Scale Preview**: Clicking the mini preview expands to full-scale view
4. **File Type Support**:
   - PDF files: Direct iframe preview
   - Office documents (DOCX, PPTX): Microsoft Office Online viewer
   - Unsupported files: Download option with file info

### Supported File Types

- **PDF**: Native browser PDF viewer with zoom controls
- **Word Documents (.docx, .doc)**: Microsoft Office Online viewer
- **PowerPoint (.pptx, .ppt)**: Microsoft Office Online viewer
- **Other files**: Download option with file type indicator

## Implementation Example

The complete implementation in a page component:

```tsx
import { DeepSearchLayout } from "@/components/deepSearch";
import { DocumentSearchResult } from "@/interfaces/DeepSearchTypes";

const DeepSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isNoResults, setIsNoResults] = useState(false);

  const handleResultClick = (result: DocumentSearchResult) => {
    // Handle document click (e.g., navigate to document detail)
    console.log("Document clicked:", result);
  };

  return (
    <div>
      {/* Search Bar */}
      {/* ... search input component ... */}

      {/* Search Results */}
      <DeepSearchLayout
        searchQuery={searchQuery}
        searchResults={searchResults}
        loading={loading}
        isSearching={isSearching}
        isNoResults={isNoResults}
        onResultClick={handleResultClick}
      />
    </div>
  );
};
```

## Styling

All components use Tailwind CSS classes and follow the application's design system:

- Card layout with shadows and hover effects
- Consistent spacing and typography
- Color-coded file type icons
- Responsive grid layouts
- Dark mode color schemes
