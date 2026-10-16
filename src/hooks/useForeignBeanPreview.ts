import { useEffect, useState } from 'react';
import {
  loadForeignBean,
  peekForeignBean,
  type ForeignBeanState,
} from '../lib/foreignBeanCache';

const UNKNOWN: ForeignBeanState = { status: 'unknown' };

/**
 * Look up one bean in another project, for a link's hover title and to tell a dead
 * link from a live one before it is clicked.
 *
 * `enabled` is what keeps this lazy: a body citing forty foreign beans fires no
 * calls on render, only when a link is actually hovered or focused. A cached
 * result — including a cached miss — is returned without a call.
 */
export function useForeignBeanPreview(
  projectPath: string | null,
  id: string | null,
  enabled: boolean
): ForeignBeanState {
  const [state, setState] = useState<ForeignBeanState>(UNKNOWN);

  useEffect(() => {
    if (!projectPath || !id) {
      setState(UNKNOWN);
      return;
    }

    const cached = peekForeignBean(projectPath, id);
    if (cached.status !== 'unknown') {
      setState(cached);
      return;
    }
    if (!enabled) {
      setState(UNKNOWN);
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });
    loadForeignBean(projectPath, id).then((resolved) => {
      if (!cancelled) setState(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [projectPath, id, enabled]);

  return state;
}
