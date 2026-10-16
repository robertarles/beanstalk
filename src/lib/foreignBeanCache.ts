import { getBean } from './tauri';

/** What is known about a bean living in another project. */
export type ForeignBeanState =
  | { status: 'unknown' }
  | { status: 'loading' }
  | { status: 'found'; title: string }
  /** The project was readable and the bean is not in it: deleted or archived. */
  | { status: 'missing' }
  /** The project could not be read. Says nothing about whether the bean exists. */
  | { status: 'error' };

const UNKNOWN: ForeignBeanState = { status: 'unknown' };

/**
 * Session cache of foreign bean lookups, keyed by project path and id.
 *
 * Negative results are cached too, or hovering a dead link would refetch on every
 * pass. Module-level rather than per-component because a body can cite the same
 * foreign bean several times, and the cache should be shared across every pane
 * that renders it.
 */
const cache = new Map<string, ForeignBeanState>();
/** In-flight lookups, so N links to one bean make one call. */
const inFlight = new Map<string, Promise<ForeignBeanState>>();

export function foreignBeanKey(projectPath: string, id: string): string {
  return `${projectPath}\n${id.toLowerCase()}`;
}

/** What is already known, without triggering a lookup. */
export function peekForeignBean(projectPath: string, id: string): ForeignBeanState {
  return cache.get(foreignBeanKey(projectPath, id)) ?? UNKNOWN;
}

/**
 * `get_bean` reports a genuinely absent bean and an unreadable project through the
 * same `Err(String)` channel, so its message is the only available signal. A
 * missing bean must not be conflated with a project we failed to open: the former
 * should render as dead, the latter should degrade to a plain cross-project link.
 */
function classify(err: unknown): ForeignBeanState {
  const message = err instanceof Error ? err.message : String(err);
  return message.startsWith('Bean not found') ? { status: 'missing' } : { status: 'error' };
}

/**
 * Fetch one foreign bean, reusing a cached or in-flight result.
 *
 * Deliberately one bean, one call: nothing here loads another project's bean set.
 */
export function loadForeignBean(projectPath: string, id: string): Promise<ForeignBeanState> {
  const key = foreignBeanKey(projectPath, id);

  const cached = cache.get(key);
  if (cached && cached.status !== 'loading') return Promise.resolve(cached);

  const running = inFlight.get(key);
  if (running) return running;

  const promise = getBean(projectPath, id)
    .then((bean): ForeignBeanState => ({ status: 'found', title: bean.title }))
    .catch(classify)
    .then((state) => {
      // An unreadable project is not cached: it may be a transient condition, and
      // caching it would keep the link degraded for the rest of the session.
      if (state.status !== 'error') cache.set(key, state);
      inFlight.delete(key);
      return state;
    });

  inFlight.set(key, promise);
  return promise;
}

/** Clear the cache. For tests. */
export function resetForeignBeanCache(): void {
  cache.clear();
  inFlight.clear();
}
