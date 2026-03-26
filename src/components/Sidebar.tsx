import { useState, memo } from 'react';
import type { Project } from '../types/beans';
import { AddProjectDialog } from './AddProjectDialog';

interface SidebarProps {
  projects: Project[];
  activeProject: string | null;
  onSelectProject: (path: string) => void;
  /** Called with the new project path after the user confirms in the dialog. */
  onAddProject?: (path: string) => Promise<void>;
  /** Called with the project path to remove after the user confirms inline. */
  onRemoveProject?: (path: string) => void;
  statusFilter: string[];
  onStatusFilter: (s: string[]) => void;
  statuses: string[];
}

export const Sidebar = memo(function Sidebar({
  projects,
  activeProject,
  onSelectProject,
  onAddProject,
  onRemoveProject,
  statusFilter,
  onStatusFilter,
  statuses,
}: SidebarProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  // path currently pending inline remove confirmation
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const handleRemoveConfirm = (path: string) => {
    setConfirmRemove(null);
    onRemoveProject?.(path);
  };

  return (
    <div className="flex flex-col h-full text-sm select-none">
      {/* Traffic light spacer for macOS overlay titlebar */}
      <div style={{ height: 'env(titlebar-area-height, 28px)' }} className="flex-shrink-0" aria-hidden="true" />
      {/* Projects section */}
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Projects
          </span>
          <button
            onClick={() => setShowAddDialog(true)}
            className="w-5 h-5 flex items-center justify-center rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Add project"
            aria-label="Add project"
          >
            <span className="text-base leading-none">+</span>
          </button>
        </div>

        <ul className="space-y-0.5">
          {projects.length === 0 && (
            <li className="text-gray-400 dark:text-gray-500 italic px-2 py-1 text-xs">
              No projects yet. Click + to add one.
            </li>
          )}
          {projects.map((project) => {
            const isActive = project.path === activeProject;
            const isPendingRemove = confirmRemove === project.path;
            const displayName = project.name || project.path.split('/').pop() || project.path;

            return (
              <li key={project.path} className="group relative">
                {isPendingRemove ? (
                  // Inline remove confirmation
                  <div className="flex items-center gap-1 px-2 py-1.5 rounded bg-red-50 dark:bg-red-950/30">
                    <span className="flex-1 text-xs text-red-700 dark:text-red-300 truncate">
                      Remove?
                    </span>
                    <button
                      onClick={() => handleRemoveConfirm(project.path)}
                      className="px-1.5 py-0.5 rounded text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmRemove(null)}
                      className="px-1.5 py-0.5 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectProject(project.path)}
                      className={[
                        'flex-1 min-w-0 text-left px-2 py-1.5 rounded transition-colors',
                        isActive
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
                      ].join(' ')}
                      title={project.path}
                    >
                      <div className="font-medium truncate">{displayName}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {project.path}
                      </div>
                    </button>

                    {/* Remove button — visible only on row hover */}
                    <button
                      onClick={() => setConfirmRemove(project.path)}
                      className="opacity-0 group-hover:opacity-100 shrink-0 w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                      title="Remove project"
                      aria-label={`Remove ${displayName}`}
                    >
                      <span className="text-sm leading-none">×</span>
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Divider */}
      <div className="mx-3 my-2 border-t border-gray-200 dark:border-gray-800" />

      {/* Status filter section */}
      <div className="px-3 pb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Status
          </span>
          {statusFilter.length > 0 && (
            <button
              onClick={() => onStatusFilter([])}
              className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
            >
              All
            </button>
          )}
        </div>

        <ul className="space-y-0.5">
          {statuses.map((status) => {
            const isActive = statusFilter.includes(status);
            return (
              <li key={status}>
                <button
                  onClick={() => {
                    if (isActive) {
                      onStatusFilter(statusFilter.filter((s) => s !== status));
                    } else {
                      onStatusFilter([...statusFilter, status]);
                    }
                  }}
                  className={[
                    'w-full text-left flex items-center gap-2 px-2 py-1.5 rounded transition-colors capitalize',
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'w-3.5 h-3.5 shrink-0 rounded border flex items-center justify-center text-xs',
                      isActive
                        ? 'border-white bg-white/20'
                        : 'border-gray-400 dark:border-gray-500',
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {isActive && '✓'}
                  </span>
                  {status}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Add Project Dialog */}
      {showAddDialog && (
        <AddProjectDialog
          onAdd={onAddProject ?? (() => Promise.resolve())}
          onClose={() => setShowAddDialog(false)}
        />
      )}
    </div>
  );
});
