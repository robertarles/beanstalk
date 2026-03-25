import { invoke } from '@tauri-apps/api/core';
import type { Bean, AppConfig } from '../types/beans';

export const getBeans = (projectPath: string) =>
  invoke<Bean[]>('get_beans', { projectPath });

export const getBean = (projectPath: string, beanId: string) =>
  invoke<Bean>('get_bean', { projectPath, beanId });

export const createBean = (params: {
  projectPath: string;
  title: string;
  beanType?: string;
  parent?: string | null;
  tags?: string[];
  assignee?: string | null;
  body?: string;
}) => invoke<Bean>('create_bean', params);

export const updateBean = (params: {
  projectPath: string;
  beanId: string;
  title?: string;
  status?: string;
  tags?: string[];
  assignee?: string | null;
  body?: string;
}) => invoke<Bean>('update_bean', params);

export const updateBeanStatus = (projectPath: string, beanId: string, status: string) =>
  invoke<Bean>('update_bean_status', { projectPath, beanId, status });

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
