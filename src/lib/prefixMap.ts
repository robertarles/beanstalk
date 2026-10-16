import type { ProjectPrefix } from '../types/beans';

/**
 * Routes a bean id to the project that owns it, by id prefix.
 *
 * Built once per project-list change rather than per link: a body citing forty
 * beans should not rebuild this forty times.
 */
export interface PrefixMap {
  /**
   * Routable projects, lowercased and sorted longest prefix first, so a
   * `beanstalk-` project is matched before a `beans-` one rather than whichever
   * happened to be configured first.
   */
  entries: ProjectPrefix[];
  /**
   * Lowercased prefixes declared by more than one configured project.
   *
   * These are deliberately absent from `entries`. Nothing stops two projects
   * declaring the same prefix — or defaulting to `bean-` — and guessing between
   * them would send a link to a same-named bean in the wrong project. Kept here
   * so a collision can be surfaced rather than merely suffered.
   */
  ambiguous: Set<string>;
}

/**
 * Build a {@link PrefixMap} from what `get_project_prefixes` returned.
 *
 * Prefixes are compared lowercased, so a project declaring `Hivelens-` and a
 * link writing `hivelens-` agree.
 */
export function buildPrefixMap(prefixes: ProjectPrefix[]): PrefixMap {
  const seen = new Map<string, number>();
  for (const p of prefixes) {
    const key = p.prefix.toLowerCase();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }

  const ambiguous = new Set<string>();
  for (const [key, count] of seen) {
    if (count > 1) ambiguous.add(key);
  }

  const entries = prefixes
    .map((p) => ({ ...p, prefix: p.prefix.toLowerCase() }))
    .filter((p) => !ambiguous.has(p.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length);

  return { entries, ambiguous };
}

/**
 * Which configured project owns `id`, or `null` if no unambiguous prefix matches.
 *
 * `null` covers both "no such project is configured" and "two projects claim
 * that prefix". Callers treat both the same way — the link does not resolve —
 * and local resolution never comes through here, so a project whose prefix
 * collides can still resolve its own beans while it is the active one.
 */
export function lookupProject(map: PrefixMap, id: string): ProjectPrefix | null {
  const needle = id.toLowerCase();
  return map.entries.find((p) => needle.startsWith(p.prefix)) ?? null;
}

/** An empty map, for callers that render before the prefixes have loaded. */
export const EMPTY_PREFIX_MAP: PrefixMap = { entries: [], ambiguous: new Set() };
