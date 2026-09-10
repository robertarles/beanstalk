import { listen } from '@tauri-apps/api/event';
import type { SystemAppearance } from '../types/beans';
import { getSystemAppearance } from './tauri';

const BASE_FONT_SIZE_PX = 16;

function apply({ prefers_dark, text_scale }: SystemAppearance): void {
  document.documentElement.classList.toggle('dark', prefers_dark);
  document.documentElement.style.fontSize = `${BASE_FONT_SIZE_PX * text_scale}px`;
}

/**
 * Best-effort synchronous guess for the very first paint, before the native
 * `get_system_appearance` round-trip resolves. Correct on platforms whose
 * webview reports `prefers-color-scheme` accurately; gets overwritten by
 * `initSystemAppearance()` regardless (notably fixing it on Linux, where
 * WebKitGTK does not reliably reflect GNOME/KDE's dark-mode setting here).
 */
export function applyInitialGuess(): void {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  apply({ prefers_dark: prefersDark, text_scale: 1 });
}

/**
 * Query the OS's actual dark-mode and text-scaling preference and apply it,
 * then keep it in sync as the user changes it while the app is running (see
 * the `system-appearance-changed` event emitted from the Rust side).
 */
export async function initSystemAppearance(): Promise<void> {
  try {
    apply(await getSystemAppearance());
  } catch {
    // Leave whatever applyInitialGuess() already set.
  }

  try {
    await listen<SystemAppearance>('system-appearance-changed', (event) => apply(event.payload));
  } catch {
    // No live updates (e.g. non-Linux, where this event is never emitted) — fine.
  }
}
