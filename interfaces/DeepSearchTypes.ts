export interface DocumentSearchResult {
    id: string;
    title: string;
    content: string;
    fileType: string;
    fileSize: string;
    uploadDate: string;
    knowledgeName?: string;
    fileUrl?: string; // Add fileUrl to support preview
    pageNumber?: number;
}

export interface DeepSearchData {
    id: string;
    name: string;
    content: string;
    fileType: string;
    fileSize: string;
    uploadDate: string;
    knowledgeName: string;
    knowledgeBaseId?: string;
    fileUrl?: string;
    pageNumber?: number;
}

export interface DeepSearchProps {
    searchQuery: string;
    searchResults: DocumentSearchResult[];
    loading: boolean;
    isSearching: boolean;
    isNoResults: boolean;
    onResultClick: (result: DocumentSearchResult) => void;
}
