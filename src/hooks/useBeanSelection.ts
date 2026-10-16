import { useCallback, useEffect, useRef } from 'react';
import type { Bean } from '../types/beans';
import { findBeanById } from '../lib/beanTree';

interface UseBeanSelectionOptions {
  activeProject: string | null;
  beans: Bean[];
  beansLoading: boolean;
  /** Switch the active project. Rejects if the project is not configured. */
  setActiveProject: (path: string) => Promise<void>;
  /** Apply a selection within the project that is now active. */
  select: (id: string) => void;
  /** Surface a user-visible failure. */
  onError: (message: string) => void;
}

/**
 * Select a bean, in this project or another configured one.
 *
 * A cross-project selection is switch-then-select — the same two steps the
 * sidebar already performs — but it cannot be done in one go: the bean list
 * reloads when the active project changes, so the target id is not in the tree
 * at the moment the switch is requested. The request is parked and applied once
 * the new project's beans have settled.
 */
export function useBeanSelection({
  activeProject,
  beans,
  beansLoading,
  setActiveProject,
  select,
  onError,
}: UseBeanSelectionOptions): (id: string, projectPath?: string) => Promise<void> {
  const pendingRef = useRef<{ id: string; projectPath: string } | null>(null);

  // Held in refs so a caller passing inline closures does not re-run the effect
  // and re-apply a selection that has already been consumed.
  const selectRef = useRef(select);
  selectRef.current = select;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const activeProjectRef = useRef(activeProject);
  activeProjectRef.current = activeProject;

  const selectBean = useCallback(
    async (id: string, projectPath?: string) => {
      if (!projectPath || projectPath === activeProjectRef.current) {
        selectRef.current(id);
        return;
      }
      pendingRef.current = { id, projectPath };
      try {
        await setActiveProject(projectPath);
      } catch (err) {
        pendingRef.current = null;
        onErrorRef.current(
          err instanceof Error ? err.message : 'Failed to switch project'
        );
      }
    },
    [setActiveProject]
  );

  useEffect(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    // Wait for the switch to take effect, then for the beans to settle. Acting
    // while `beansLoading` would read the previous project's (or an empty) tree
    // and wrongly report the target as gone.
    if (activeProject !== pending.projectPath) return;
    if (beansLoading) return;

    pendingRef.current = null;
    if (findBeanById(beans, pending.id)) {
      selectRef.current(pending.id);
    } else {
      // Archived, deleted, or the id's prefix collided. Say so and stay in the
      // project we switched to — bouncing back would leave no trace of why.
      onErrorRef.current(`${pending.id} is missing or archived`);
    }
  }, [activeProject, beans, beansLoading]);

  return selectBean;
}
