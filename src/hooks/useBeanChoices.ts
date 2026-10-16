import { useMemo } from 'react';
import type { Bean, ProjectPrefix } from '../types/beans';
import { flattenBeans } from '../lib/beanTree';
import { useForeignBeans } from './useForeignBeans';

/** One offerable choice: a bean, plus its project when that is not the active one. */
export interface BeanChoice {
  id: string;
  title: string;
  /** `undefined` for a bean in the active project. */
  projectName?: string;
}

interface UseBeanChoicesOptions {
  /** The active project's loaded bean tree. */
  beans: Bean[];
  /** Configured projects other than the active one; empty keeps the picker local. */
  otherProjects?: ProjectPrefix[];
  /** The user's search text. */
  query: string;
  /** Whether the picker is showing; gates the cross-project load. */
  active: boolean;
  /** Ids to leave out — the bean being edited, and anything already chosen. */
  exclude?: string[];
}

/**
 * Build the list of beans a picker can offer, across projects.
 *
 * Shared by the relation pickers and the `[[` autocomplete so there is one place
 * that decides what is offerable and how it is matched, rather than two that drift.
 */
export function useBeanChoices({
  beans,
  otherProjects = [],
  query,
  active,
  exclude = [],
}: UseBeanChoicesOptions): { choices: BeanChoice[]; loading: boolean } {
  const needle = query.trim().toLowerCase();

  // Other projects are read only once the user actually searches, so merely
  // opening a picker costs nothing beyond the active project.
  const { foreign, loading } = useForeignBeans(otherProjects, active && needle !== '');

  const all = useMemo<BeanChoice[]>(() => {
    const local = flattenBeans(beans).map((b) => ({ id: b.id, title: b.title }));
    const remote = foreign.map((f) => ({
      id: f.bean.id,
      title: f.bean.title,
      projectName: f.projectName,
    }));
    return [...local, ...remote];
  }, [beans, foreign]);

  const excluded = useMemo(() => new Set(exclude), [exclude]);

  const choices = useMemo(() => {
    const selectable = all.filter((c) => !excluded.has(c.id));
    if (!needle) return selectable;
    return selectable.filter(
      (c) => c.title.toLowerCase().includes(needle) || c.id.toLowerCase().includes(needle)
    );
  }, [all, excluded, needle]);

  return { choices, loading };
}
