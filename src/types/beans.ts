export interface Bean {
  id: string;
  title: string;
  status: string;
  bean_type: string;
  parent: string | null;
  tags: string[];
  priority: string | null;
  created_at: string | null;
  updated_at: string | null;
  body: string;
  file_path: string;
  children: Bean[];
  blocking: string[];
  blocked_by: string[];
}

export interface BeansConfig {
  name: string | null;
  statuses: string[];
}

export interface Project {
  path: string;
  name: string;
}

/**
 * A configured project together with the id prefix its beans carry.
 *
 * Bean ids are minted as `{prefix}{random}`, so the prefix alone says which
 * project owns an id — which is what makes a bare `[[hivelens-7k2p]]` resolvable
 * across projects with no project-qualified link syntax.
 */
export interface ProjectPrefix {
  path: string;
  name: string;
  prefix: string;
}

/** Whether bean writes are possible, and which binary would perform them. */
export interface BeansCliStatus {
  available: boolean;
  path: string | null;
  version: string | null;
  error: string | null;
}

/** A failed `beans` invocation. `code` is machine-readable (e.g. CONFLICT). */
export interface BeansCliError {
  code: string;
  message: string;
}

export interface AppConfig {
  projects: Project[];
  last_active_project: string | null;
  editor: string | null;
  recent_projects: string[];
  scripts_dir: string | null;
  /** Override for the `beans` binary path; null resolves from PATH. */
  beans_bin: string | null;
}

/** Where a bean script was discovered. Project scripts shadow global ones. */
export type ScriptScope = 'global' | 'project';

/** A discovered, runnable bean action script. */
export interface BeanScript {
  /** Filename (e.g. `jira.sh`) — the shadowing key and the run identifier. */
  id: string;
  name: string;
  description: string | null;
  /** Optional single-character accelerator declared by the script. */
  key: string | null;
  path: string;
  scope: ScriptScope;
  timeout_secs: number;
}

/** The result of running a bean script. */
export interface ScriptOutput {
  script_id: string;
  name: string;
  success: boolean;
  exit_code: number | null;
  stdout: string;
  stderr: string;
  timed_out: boolean;
}

/** The OS-level dark mode / text scaling preference, as detected natively. */
export interface SystemAppearance {
  prefers_dark: boolean;
  /** e.g. 1.25 for GNOME's "Large Text" accessibility setting. */
  text_scale: number;
}

export type { PrefixMap } from '../lib/prefixMap';
