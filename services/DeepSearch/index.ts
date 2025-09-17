import { DeepSearchRequest } from '@/interfaces/DeepSearch';
import { DeepSearchRes } from '@/interfaces/DocumentIngestion';
import type { TypedFetchError } from '@/interfaces/FetchTypes';
import { BaseFetchClient } from '@/utils/fetchClient';
import { createClient } from '@/utils/supabase/client';

export interface DeepSearchResult {
    knowledge_ids?: string[],
    query: string,
    limit?: number,
    min_score?: number
}

export class DeepSearchService {
    private client: BaseFetchClient;
    private supabase = createClient();

    constructor() {
        // Initialize with fetch client
        this.client = new BaseFetchClient({
            baseURL: process.env.NEXT_PUBLIC_INGRESS_SERVICE || 'https://localhost:5001',
            timeout: 10000,
            defaultHeaders: {
                Accept: '*/*',
                'Content-Type': 'application/json',
            },
        });
    }



    private async getAccessToken(): Promise<string | null> {
        const { data: { session }, error } = await this.supabase.auth.getSession();
        if (error) {
                        return null;
        }
        return session?.access_token || null;
    }

    /**
     * Handle API errors and convert them to user-friendly messages
     */
    private handleApiError(error: TypedFetchError): Error {
        if (error.isNetworkError) {
            return new Error('DeepSearch processing service is not available. Please check if the service is running.');
        }

        if (error.isTimeoutError) {
            return new Error('DeepSearch request timeout. Please try again.');
        }

        if (error.status) {
            const status = error.status;
            const message = error.message || error.statusText || 'Unknown error';

            switch (status) {
                case 400:
                    return new Error(`Bad request: ${message}`);
                case 404:
                    return new Error(`Resource not found: ${message}`);
                case 500:
                    return new Error(`Server error: ${message}`);
                default:
                    return new Error(`API error (${status}): ${message}`);
            }
        }

        return new Error(error.message || 'Unknown API error');
    }

    async DeepSearch(query: DeepSearchRequest): Promise<DeepSearchRes[]> {
        try {
            const token = await this.getAccessToken();
            const headers: Record<string, string> = {};
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await this.client.post<DeepSearchRes[]>('/deep-search', query, {
                headers,
            });
            
            return response.data;
        } catch (error) {
            throw this.handleApiError(error as TypedFetchError);
        }
    }
}
