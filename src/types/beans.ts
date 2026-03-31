export interface Bean {
  id: string;
  title: string;
  status: string;
  bean_type: string;
  parent: string | null;
  tags: string[];
  priority: string | null;
  assignee: string | null;
  created_at: string | null;
  updated_at: string | null;
  body: string;
  file_path: string;
  children: Bean[];
}

export interface BeansConfig {
  name: string | null;
  statuses: string[];
}

export interface Project {
  path: string;
  name: string;
}

export interface AppConfig {
  projects: Project[];
  last_active_project: string | null;
  editor: string | null;
}
