import { invoke } from '@tauri-apps/api/core';
import { openUrl as tauriOpenUrl } from '@tauri-apps/plugin-opener';
import type { Bean, AppConfig } from '../types/beans';

export const getBeans = (projectPath: string) =>
  invoke<Bean[]>('get_beans', { projectPath });

export const getBean = (projectPath: string, beanId: string) =>
  invoke<Bean>('get_bean', { projectPath, beanId });

export const createBean = (params: {
  projectPath: string;
  title: string;
  status: string;
  beanType?: string;
  parent?: string | null;
  tags?: string[];
  assignee?: string | null;
  body?: string;
  blocking?: string[];
  blockedBy?: string[];
}) => invoke<Bean>('create_bean', params);

export const updateBean = (params: {
  projectPath: string;
  beanId: string;
  title?: string;
  status?: string;
  tags?: string[];
  assignee?: string | null;
  body?: string;
  parent?: string | null;
  priority?: string | null;
  blocking?: string[];
  blockedBy?: string[];
}) => {
  // Rust's serde maps JSON null → None (keep existing) for Option<String>.
  // Send "" instead of null so the backend receives Some("") and clears priority.
  const payload = { ...params };
  if (payload.priority === null) payload.priority = '';
  return invoke<Bean>('update_bean', payload);
};

export const updateBeanStatus = (projectPath: string, beanId: string, status: string) =>
  invoke<Bean>('update_bean_status', { projectPath, beanId, status });

export const touchBean = (projectPath: string, beanId: string) =>
  invoke<Bean>('update_bean', { projectPath, beanId });

export const searchBeans = (
  projectPath: string,
  query: string,
  filters?: {
    status?: string;
    beanType?: string;
    assignee?: string;
    tags?: string[];
  }
) => invoke<Bean[]>('search_beans', { projectPath, query, ...filters });

export const openBeanInEditor = (projectPath: string, beanId: string) =>
  invoke<void>('open_bean_in_editor', { projectPath, beanId });

export const getConfig = () => invoke<AppConfig>('get_config');

export const addProject = (path: string) => invoke<AppConfig>('add_project', { path });

export const removeProject = (path: string) => invoke<AppConfig>('remove_project', { path });

export const setActiveProject = (path: string) => invoke<AppConfig>('set_active_project', { path });

export const startWatching = (projectPath: string) => invoke<void>('start_watching', { projectPath });

export const stopWatching = (projectPath: string) => invoke<void>('stop_watching', { projectPath });

export const openUrl = (url: string): Promise<void> => tauriOpenUrl(url);
