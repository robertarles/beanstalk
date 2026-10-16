import type { BeansCliError } from '../types/beans';

/**
 * Normalise whatever a Tauri command rejected with into a structured error.
 *
 * Backend write commands reject with a `BeansCliError` object rather than a
 * string, so `err instanceof Error` is false and the message would otherwise be
 * thrown away.
 */
export function asBeansError(err: unknown): BeansCliError {
  if (typeof err === 'object' && err !== null && 'code' in err && 'message' in err) {
    const e = err as { code: unknown; message: unknown };
    return { code: String(e.code), message: String(e.message) };
  }
  if (err instanceof Error) return { code: 'UNKNOWN', message: err.message };
  return { code: 'UNKNOWN', message: String(err) };
}

/** A save refused because the bean changed on disk underneath the editor. */
export function isConflict(err: unknown): boolean {
  return asBeansError(err).code === 'CONFLICT';
}

/** Writes are unavailable because the `beans` binary could not be found. */
export function isBeansUnavailable(err: unknown): boolean {
  return asBeansError(err).code === 'BEANS_UNAVAILABLE';
}
