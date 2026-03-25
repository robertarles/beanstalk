import { useState, useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { Bean } from '../types/beans';
import { getBeans } from '../lib/tauri';

interface UseBeansResult {
  beans: Bean[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastRefreshed: number | undefined;
}

export function useBeans(projectPath: string | null): UseBeansResult {
  const [beans, setBeans] = useState<Bean[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number | undefined>(undefined);

  const loadBeans = useCallback(async () => {
    if (!projectPath) {
      setBeans([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getBeans(projectPath);
      setBeans(result);
      setLastRefreshed(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBeans([]);
    } finally {
      setLoading(false);
    }
  }, [projectPath]);

  useEffect(() => {
    loadBeans();
  }, [loadBeans]);

  // Listen for beans-changed Tauri events for this project
  useEffect(() => {
    if (!projectPath) return;

    const unlistenPromise = listen<{ project_path: string }>('beans-changed', (event) => {
      if (event.payload.project_path === projectPath) {
        loadBeans();
      }
    });

    return () => {
      unlistenPromise.then((fn) => fn());
    };
  }, [projectPath, loadBeans]);

  const refresh = useCallback(() => {
    loadBeans();
  }, [loadBeans]);

  return { beans, loading, error, refresh, lastRefreshed };
}
