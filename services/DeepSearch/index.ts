import { DeepSearchRequest } from "@/interfaces/DeepSearch";
import { createClient } from "@/utils/supabase/client";
import axios, { Axios, AxiosInstance, AxiosResponse } from "axios";


export interface DeepSearchResult {
    knowledge_ids?: string[],
    query: string,
    limit?: number,
    min_score?: number
}



export class DeepSearchService {
    // private client: Axios;
    private config: {
        method?: string;
        url: string | undefined;
        // timeout: number;
        headers: Record<string, string>;
    };
    private token: string | undefined;
    private supabase = createClient();

    constructor() {
        // Initialize with default config
        this.config = {
            method: 'post',
            url: process.env.NEXT_PUBLIC_INGRESS_SERVICE + 'deep-search',
            // timeout: 10000,
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
            },
        };
    }

    private async initializeAuth(): Promise<void> {
        await this.getAccessToken();
    }

    private async getAccessToken(): Promise<void> {
        const { data: { session }, error } = await this.supabase.auth.getSession();
        if (error) {
            console.error('Error getting session for API request:', error);
            return;
        }

        // Update config with new headers
        this.config = {
            ...this.config,
            headers: {
                ...this.config.headers,
                'Authorization': `Bearer ${session?.access_token}`,
            },
        };
    }

    /**
     * Handle API errors and convert them to user-friendly messages
     */
    private handleApiError(error: Error & { response?: AxiosResponse; code?: string }): Error {
        if (error.code === 'ECONNREFUSED') {
            return new Error('DeepSearch processing service is not available. Please check if the service is running on localhost:5001');
        }

        if (error.response) {
            const status = error.response.status;
            const message = (error.response.data as { message?: string })?.message || error.response.statusText;

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

    async DeepSearch(query: DeepSearchRequest): Promise<DeepSearchResult[]> {
        try {

            await this.initializeAuth();
            const response = await axios.request({
                ...this.config,
                data: query,
            });
            return response.data;
        } catch (error) {
            throw this.handleApiError(error as Error & { response?: AxiosResponse; code?: string });
        }
    }
}