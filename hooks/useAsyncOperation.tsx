'use client';

import { useCallback, useState } from 'react';

export interface AsyncState<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseAsyncOperationReturn<T = unknown> {
  state: AsyncState<T>;
  execute: <P extends unknown[]>(asyncFn: (...params: P) => Promise<T>, ...params: P) => Promise<T | null>;
  setData: (data: T | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

/**
 * Unified hook for handling async operations with loading, error, and data states
 * Consolidates the common pattern used across the application
 */
export function useAsyncOperation<T = unknown>(
  initialData: T | null = null
): UseAsyncOperationReturn<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data, error: null }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, loading: false }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({ ...prev, loading, error: loading ? null : prev.error }));
  }, []);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  const execute = useCallback(
    async <P extends unknown[]>(
      asyncFn: (...params: P) => Promise<T>,
      ...params: P
    ): Promise<T | null> => {
      try {
        setLoading(true);
        const result = await asyncFn(...params);
        setData(result);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setData, setError, setLoading]
  );

  return {
    state,
    execute,
    setData,
    setError,
    setLoading,
    reset,
  };
}
