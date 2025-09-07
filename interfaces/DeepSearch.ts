
export interface DeepSearchRequest {
    knowledge_ids?: string[];
    query: string;
    limit?: number;
    min_score?: number;
}