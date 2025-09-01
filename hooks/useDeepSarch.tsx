import { DeepSearchRes } from '@/interfaces/DocumentIngestion';
import { DeepSearchResult, DeepSearchService } from '@/services/DeepSearch';
import { useState } from 'react';

export interface useDeepSearchReturn {
  results: DeepSearchRes[];
  loading: boolean;
  error: Error | null;
  executeSearch: (query: DeepSearchResult) => Promise<DeepSearchRes[]>;
}

export const useDeepSearch = (): useDeepSearchReturn => {
  const [results, setResults] = useState<DeepSearchRes[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const deepSearchService = new DeepSearchService();

  const executeSearch = async (
    query: DeepSearchResult,
  ): Promise<DeepSearchRes[]> => {
    try {
      setLoading(true);
      setError(null);
      const response = await deepSearchService.DeepSearch(query);
      setResults(response);
      return response;
    } catch (error) {
      setError(error as Error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, executeSearch };
};
