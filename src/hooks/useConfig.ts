import { useState, useEffect, useCallback } from 'react';
import type { AppConfig } from '../types/beans';
import {
  getConfig,
  addProject as tauriAddProject,
  removeProject as tauriRemoveProject,
  setActiveProject as tauriSetActiveProject,
} from '../lib/tauri';

interface UseConfigResult {
  config: AppConfig | null;
  loading: boolean;
  addProject: (path: string) => Promise<void>;
  removeProject: (path: string) => Promise<void>;
  setActiveProject: (path: string) => Promise<void>;
}

export function useConfig(): UseConfigResult {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getConfig()
      .then((cfg) => {
        if (!cancelled) setConfig(cfg);
      })
      .catch(() => {
        if (!cancelled) setConfig(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const addProject = useCallback(async (path: string) => {
    const updated = await tauriAddProject(path);
    setConfig(updated);
  }, []);

  const removeProject = useCallback(async (path: string) => {
    const updated = await tauriRemoveProject(path);
    setConfig(updated);
  }, []);

  const setActiveProject = useCallback(async (path: string) => {
    const updated = await tauriSetActiveProject(path);
    setConfig(updated);
  }, []);

  return { config, loading, addProject, removeProject, setActiveProject };
}
