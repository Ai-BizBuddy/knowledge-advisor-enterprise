export interface DocumentSearchResult {
    id: string;
    title: string;
    content: string;
    // relevanceScore: number;
    fileType: string;
    fileSize: string;
    uploadDate: string;
    // tags?: string[];
    knowledgeName?: string;
}

export interface DeepSearchData {
    id: string;
    name: string;
    content: string;
    fileType: string;
    fileSize: string;
    uploadDate: string;
    knowledgeName: string;
    fileUrl?: string;
}

export interface DeepSearchProps {
    searchQuery: string;
    searchResults: DocumentSearchResult[];
    loading: boolean;
    isSearching: boolean;
    isNoResults: boolean;
    onResultClick: (result: DocumentSearchResult) => void;
}
