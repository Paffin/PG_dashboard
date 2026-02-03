import { useState, useEffect, useCallback, useRef } from 'react';
import { useServer } from '../contexts/ServerContext';

interface UseServerDataOptions {
  /** Auto-refresh interval in ms. Set to 0 to disable */
  refreshInterval?: number;
  /** Whether auto-refresh is enabled */
  autoRefresh?: boolean;
}

interface UseServerDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching server-specific data with proper loading/error handling
 * and optional auto-refresh using setTimeout (not setInterval) to prevent
 * request accumulation
 */
export function useServerData<T>(
  fetcher: (serverId: string) => Promise<T>,
  options: UseServerDataOptions = {}
): UseServerDataResult<T> {
  const { refreshInterval = 5000, autoRefresh = false } = options;
  const { serverId } = useServer();

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!serverId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const result = await fetcher(serverId);

      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      }
    }
  }, [serverId, fetcher]);

  // Schedule next fetch using setTimeout (not setInterval)
  const scheduleNextFetch = useCallback(() => {
    if (autoRefresh && refreshInterval > 0 && mountedRef.current) {
      timeoutRef.current = window.setTimeout(async () => {
        await fetchData();
        scheduleNextFetch();
      }, refreshInterval);
    }
  }, [autoRefresh, refreshInterval, fetchData]);

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);

    fetchData().then(() => {
      scheduleNextFetch();
    });

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [serverId, fetchData, scheduleNextFetch]);

  // Handle autoRefresh toggle
  useEffect(() => {
    if (!autoRefresh && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    } else if (autoRefresh && !timeoutRef.current) {
      scheduleNextFetch();
    }
  }, [autoRefresh, scheduleNextFetch]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}
