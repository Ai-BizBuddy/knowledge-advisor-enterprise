import { deepSearchService } from "@/services";
import { DeepSearchResult } from "@/services/DeepSearch";
import { useState } from "react";

export interface useDeepSearchReturn {
  results: DeepSearchResult[];
  loading: boolean;
  error: Error | null;
  executeSearch: (query: DeepSearchResult) => Promise<void>;
}

export const useDeepSearch = (): useDeepSearchReturn => {
  const [results, setResults] = useState<DeepSearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const executeSearch = async (query: DeepSearchResult) => {
    try {
      setLoading(true);
      setError(null);
      //   const token = JSON.parse(
      //     localStorage.getItem("sb-api-auth-token") || "{}",
      //   );
      const response = await deepSearchService.DeepSearch(query);
      //   fetch(
      //     process.env.NEXT_PUBLIC_INGRESS_SERVICE + "deep-search",
      //     {
      //       method: "POST",
      //       headers: {
      //         "Content-Type": "application/json",
      //         Authorization: `Bearer ${token.access_token}`,
      //       },
      //       body: JSON.stringify(query),
      //     },
      //   );
      console.log("Deep search response:", response);
      setResults(response);
    } catch (error) {
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return { results, loading, error, executeSearch };
};
