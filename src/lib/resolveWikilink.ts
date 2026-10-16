import type { Bean } from '../types/beans';
import { flattenBeans } from './beanTree';
import { lookupProject, type PrefixMap } from './prefixMap';

/**
 * What a `[[...]]` target points at.
 *
 * Three cases, not two. A `Bean | null` return could only say "here" or
 * "nowhere", which would render `[[hivelens-7k2p]]` as broken inside a Beanstalk
 * bean when the link is perfectly good and the user has simply not switched
 * projects — and every consumer built on it would have inherited that.
 */
export type WikilinkTarget =
  | { kind: 'local'; bean: Bean }
  | { kind: 'foreign'; projectPath: string; projectName: string; id: string }
  | { kind: 'missing' };

/**
 * An id lookup over the beans of one project.
 *
 * Built once per bean-set change rather than per link: a body citing forty beans
 * should not walk the tree forty times.
 */
export type BeanIndex = Map<string, Bean>;

/** Index the loaded bean tree by lowercased id. */
export function buildBeanIndex(beans: Bean[]): BeanIndex {
  const index: BeanIndex = new Map();
  for (const bean of flattenBeans(beans)) {
    index.set(bean.id.toLowerCase(), bean);
  }
  return index;
}

/** Everything resolution needs, built once per bean-set or project-list change. */
export interface WikilinkContext {
  /** Ids of the active project's loaded beans. */
  index: BeanIndex;
  /** Prefix → project routing for every configured project. */
  prefixMap: PrefixMap;
  /** The active project's path, or `null` when none is open. */
  activeProjectPath: string | null;
}

/**
 * Resolve a raw wikilink target against the loaded beans and the prefix map.
 *
 * Pure and synchronous, and deliberately so: `foreign` is decided by *prefix*,
 * never by loading another project's beans, which is what keeps this side of the
 * feature free of Tauri and trivial to cover.
 *
 * Matching is case-insensitive over the whole id, prefix included.
 *
 * `missing` covers a deleted bean, an archived one (`.beans/archive` is not
 * scanned), a project that was never added, and an id whose prefix two projects
 * both claim — the last of which `lookupProject` declines rather than guessing.
 */
export function resolveWikilink(target: string, ctx: WikilinkContext): WikilinkTarget {
  const id = target.trim().toLowerCase();
  if (id === '') return { kind: 'missing' };

  const local = ctx.index.get(id);
  if (local) return { kind: 'local', bean: local };

  const project = lookupProject(ctx.prefixMap, id);
  if (!project) return { kind: 'missing' };

  // The prefix points at the project already open, yet the id is not in its
  // loaded beans — so the bean is gone or archived, not elsewhere. Reporting
  // `foreign` here would offer to "switch" to the current project and then fail
  // to find anything. The loaded index is authoritative for the active project.
  if (ctx.activeProjectPath !== null && project.path === ctx.activeProjectPath) {
    return { kind: 'missing' };
  }

  return {
    kind: 'foreign',
    projectPath: project.path,
    projectName: project.name,
    id,
  };
}

/** The wording for a target that resolves nowhere. */
export const MISSING_LABEL = 'missing or archived';

/**
 * Hover text for a resolved target.
 *
 * `missing` never says "unknown": an archived bean is unresolvable through no
 * fault of whoever wrote the link, and that is the common case, so blaming the
 * author would be wrong more often than not.
 */
export function wikilinkTitle(resolved: WikilinkTarget): string {
  switch (resolved.kind) {
    case 'local':
      return `Go to ${resolved.bean.id}`;
    case 'foreign':
      return `Go to ${resolved.id} in ${resolved.projectName}`;
    case 'missing':
      return `This bean is ${MISSING_LABEL}`;
  }
}
