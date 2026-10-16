import { useEffect, useRef, useState } from 'react';
import type { Bean, ProjectPrefix } from '../types/beans';
import { getBeans } from '../lib/tauri';
import { flattenBeans } from '../lib/beanTree';

/** A bean from a project other than the active one, tagged with its owner. */
export interface ForeignBean {
  bean: Bean;
  projectPath: string;
  projectName: string;
}

/** Join paths into a key that tracks the list's contents rather than its identity. */
function pathsKey(projects: ProjectPrefix[]): string {
  return projects.map((p) => p.path).join('\n');
}

/**
 * Load the beans of projects other than the active one, for pickers that offer
 * cross-project choices.
 *
 * Gated on `enabled` and loaded once per project, because this is the one place
 * in the feature that reads other projects' beans in bulk. Offering a bean as a
 * choice means knowing it exists, so there is no prefix trick to avoid it here —
 * but it is deferred until the user actually searches, so merely opening a bean
 * never pays for it. The wikilink *rendering* path never comes through here.
 */
export function useForeignBeans(
  projects: ProjectPrefix[],
  enabled: boolean
): { foreign: ForeignBean[]; loading: boolean } {
  const [foreign, setForeign] = useState<ForeignBean[]>([]);
  const [loading, setLoading] = useState(false);
  // Paths already loaded, so reopening the picker does not refetch.
  const loadedRef = useRef(new Set<string>());

  const key = pathsKey(projects);

  useEffect(() => {
    if (!enabled) return;
    const pending = projects.filter((p) => !loadedRef.current.has(p.path));
    if (pending.length === 0) return;

    let cancelled = false;
    setLoading(true);
    Promise.all(
      pending.map((p) =>
        getBeans(p.path)
          .then((beans) =>
            flattenBeans(beans).map((bean) => ({
              bean,
              projectPath: p.path,
              projectName: p.name,
            }))
          )
          // One unreadable project must not blank the whole picker.
          .catch(() => [] as ForeignBean[])
      )
    ).then((batches) => {
      if (cancelled) return;
      for (const p of pending) loadedRef.current.add(p.path);
      setForeign((prev) => [...prev, ...batches.flat()]);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // `key` stands in for the project list's contents rather than its identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key]);

  // Dropping a project should drop its beans, and re-adding it should refetch.
  useEffect(() => {
    const paths = new Set(projects.map((p) => p.path));
    for (const path of [...loadedRef.current]) {
      if (!paths.has(path)) loadedRef.current.delete(path);
    }
    setForeign((prev) => prev.filter((f) => paths.has(f.projectPath)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { foreign, loading };
}
