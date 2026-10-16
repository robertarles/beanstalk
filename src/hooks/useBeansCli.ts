import { useEffect, useState } from 'react';
import type { BeansCliStatus } from '../types/beans';
import { beansCliStatus } from '../lib/tauri';

/** Assume unavailable until proven otherwise, so writes are never offered blindly. */
const UNRESOLVED: BeansCliStatus = {
  available: false,
  path: null,
  version: null,
  error: null,
};

/**
 * Whether bean writes are possible.
 *
 * Beanstalk writes bean files only through the `beans` binary (beanstalk-dg1m),
 * so every write path is gated on this: the edit form, the status dropdown, the
 * `s` key, Touch, and creating a bean.
 *
 * Reads are unaffected — Beanstalk parses bean files itself — and so is the
 * external editor, which launches an editor rather than writing anything. That
 * exemption is deliberate: it is the escape hatch that keeps the detail pane
 * from becoming a dead end when the binary is missing, and it can write
 * frontmatter `beans` cannot express.
 *
 * Checked once per session. A binary appearing mid-session is rare enough that
 * polling would cost more than it is worth; `resolved` lets callers avoid
 * flashing a disabled state before the first answer arrives.
 */
export function useBeansCli(): BeansCliStatus & { resolved: boolean } {
  const [status, setStatus] = useState<BeansCliStatus>(UNRESOLVED);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    beansCliStatus()
      .then((s) => {
        if (!cancelled) {
          setStatus(s);
          setResolved(true);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus({
          available: false,
          path: null,
          version: null,
          error: err instanceof Error ? err.message : 'Could not check for the `beans` CLI',
        });
        setResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...status, resolved };
}
