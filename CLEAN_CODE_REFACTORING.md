# 📁 Documents Page - Clean Code Architecture

## 🏗️ **Refactored Structure Overview**

The Documents page has been completely refactored from a single 980-line file into a modular, maintainable architecture with clear separation of concerns.

## 📂 **New Folder Structure**

```
├── data/
│   └── documentsData.ts                     # Document data & interfaces
├── utils/
│   └── documentsUtils.ts                    # Utility functions (sorting, filtering)
├── hooks/
│   └── useDocumentsManagement.tsx           # Custom hook for all document logic
├── components/
│   ├── documentDetail/
│   │   └── index.tsx                        # Document detail panel component
│   └── documentsPage/
│       ├── index.tsx                        # Main exports
│       ├── DocumentsHeader/
│       │   └── index.tsx                    # Page header component
│       ├── DocumentsControls/
│       │   └── index.tsx                    # Sort controls & filters
│       ├── DocumentsTabs/
│       │   └── index.tsx                    # Enhanced tabs with actions
│       ├── DocumentsSearch/
│       │   └── index.tsx                    # Search input component
│       ├── BulkActions/
│       │   └── index.tsx                    # Bulk selection actions
│       ├── DocumentsTable/
│       │   └── index.tsx                    # Data table component
│       └── DocumentsPagination/
│           └── index.tsx                    # Pagination controls
└── app/(main)/documents/
    └── page.tsx                             # Clean main page (94 lines)
```

## 🧩 **Component Architecture**

### **1. Data Layer**

- **📄 `data/documentsData.ts`**
  - Document interface definition
  - Sample documents data (20 items)
  - Type-safe data structure

### **2. Utility Layer**

- **🔧 `utils/documentsUtils.ts`**
  - `getFileIcon()` - File type icons
  - `sortDocuments()` - Multi-criteria sorting
  - `getTabCounts()` - Tab document counts
  - `filterDocuments()` - Search & filter logic

### **3. Business Logic Layer**

- **🎣 `hooks/useDocumentsManagement.tsx`**
  - All state management (selection, pagination, sorting)
  - Event handlers (search, sort, select, tab actions)
  - Keyboard shortcuts (Ctrl+A, Escape)
  - Loading states management
  - Complete separation of logic from UI

### **4. Component Layer**

Each component has a single responsibility:

#### **🏷️ DocumentsHeader**

```tsx
interface DocumentsHeaderProps {}
```

- Static page title and description
- Clean, reusable header component

#### **🎛️ DocumentsControls**

```tsx
interface DocumentsControlsProps {
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: string) => void;
  onSortOrderToggle: () => void;
}
```

- Sort dropdown & order toggle
- Filters button (ready for future expansion)

#### **📑 DocumentsTabs**

```tsx
interface DocumentsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  documents: Document[];
  onTabAction: (action: string) => void;
  loading: boolean;
}
```

- Enhanced tabs with document counts
- Status indicators (Processing, Failed, Processed)
- Contextual actions (Retry All, Refresh)
- Real-time status updates

#### **🔍 DocumentsSearch**

```tsx
interface DocumentsSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}
```

- Search input with icon
- Real-time filtering capability

#### **📦 BulkActions**

```tsx
interface BulkActionsProps {
  selectedDocuments: number[];
  totalPages: number;
  onDelete: () => void;
  onClear: () => void;
}
```

- Selection summary & actions
- Download, Share, Delete buttons
- Keyboard shortcuts hint
- Cross-page selection support

#### **📊 DocumentsTable**

```tsx
interface DocumentsTableProps {
  documents: Document[];
  selectedDocuments: number[];
  selectedDocument: number;
  startIndex: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (column: string) => void;
  onSelectAll: () => void;
  onSelectDocument: (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  onDocumentClick: (index: number) => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
}
```

- Sortable table headers
- Multi-select checkboxes
- Row selection states
- File type icons
- Responsive design

#### **📄 DocumentsPagination**

```tsx
interface DocumentsPaginationProps {
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  totalDocuments: number;
  onPageChange: (page: number) => void;
}
```

- Smart pagination with ellipsis
- Results summary
- Navigation controls

#### **📋 DocumentDetail**

```tsx
interface DocumentDetailProps extends Document {}
```

- Document preview panel
- Status indicators
- Project badges
- Action buttons
- Apollo Core project preview

## 🔄 **Data Flow**

```
📄 documentsData.ts → 🎣 useDocumentsManagement → 🧩 Components → 📱 UI
                  ↗️                            ↗️
🔧 documentsUtils.ts                    📋 DocumentDetail
```

1. **Data Source**: `documentsData.ts` provides typed document data
2. **Business Logic**: `useDocumentsManagement` handles all state & logic
3. **Components**: Receive props and render UI
4. **Utils**: Provide pure functions for data manipulation

## ✨ **Benefits of Refactoring**

### **🧹 Code Quality**

- **980 lines → 94 lines** main page
- Single responsibility components
- Type-safe interfaces throughout
- No code duplication

### **🔧 Maintainability**

- Easy to locate and modify specific features
- Clear component boundaries
- Reusable utility functions
- Centralized state management

### **🧪 Testability**

- Components can be tested in isolation
- Pure utility functions easy to test
- Custom hook can be unit tested
- Mock-friendly interfaces

### **🚀 Performance**

- Optimized re-renders with proper prop passing
- Memoization opportunities for expensive operations
- Lazy loading possibilities for large datasets

### **👥 Team Development**

- Multiple developers can work on different components
- Clear ownership of functionality
- Easy to onboard new team members
- Consistent code patterns

## 🎯 **Component Usage**

### **Main Page Implementation**

```tsx
export default function DocumentsPage() {
  const { setLoading } = useLoading();
  const documentsState = useDocumentsManagement();

  return (
    <div className="min-h-screen rounded-lg bg-gray-100 dark:bg-gray-900">
      <div className="p-4">
        <DocumentsHeader />
        <DocumentsControls {...controlsProps} />

        <div className="flex gap-6">
          <div className="flex-1">
            <DocumentsTabs {...tabsProps} />
            <DocumentsSearch {...searchProps} />
            <BulkActions {...bulkProps} />
            <DocumentsTable {...tableProps} />
            <DocumentsPagination {...paginationProps} />
          </div>

          <div className="w-80 flex-shrink-0">
            <DocumentDetail {...selectedDocument} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 📈 **Future Enhancements**

With this modular structure, future features can be easily added:

- **🔄 Real API Integration**: Update `useDocumentsManagement` hook
- **📱 Grid View**: Add new `DocumentsGrid` component
- **🔍 Advanced Filters**: Extend `DocumentsControls` component
- **📊 Analytics**: Add tracking to individual components
- **♿ Accessibility**: Enhance components with ARIA attributes
- **🎨 Theming**: Consistent styling across all components

## 🎉 **Summary**

The Documents page has been transformed from a monolithic 980-line file into a clean, modular architecture with:

- **8 specialized components** in separate folders
- **1 custom hook** for all business logic
- **1 utility file** for pure functions
- **1 data file** for type-safe data
- **94-line main page** that composes everything together

This structure follows React best practices, promotes code reusability, and makes the codebase much easier to maintain and extend. 🚀
