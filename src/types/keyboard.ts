/**
 * Keyboard navigation types for Beanstalk.
 * Supports vim-style j/k/h/l navigation across three panels.
 */

/** The three focusable panels in the app layout. */
export type FocusedPanel = 'sidebar' | 'list' | 'detail';

/** Full keyboard navigation state. */
export interface KeyboardNavState {
  /** Which panel currently has keyboard focus. */
  focusedPanel: FocusedPanel;
  /** Index into the flat (visible) bean list; -1 means nothing selected. */
  selectedBeanIndex: number;
  /** Whether a modal (e.g. keyboard help overlay) is open. */
  isModalOpen: boolean;
  /** Tracks the first key of a multi-key sequence (e.g. 'g' for 'gg'). */
  pendingKey: string | null;
}

/** A handler registered for the Escape key.
 *  Returns true if it handled the event (stops further processing). */
export interface EscapeHandler {
  /** Higher numbers run first. */
  priority: number;
  handler: () => boolean;
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isFocusedPanel(value: unknown): value is FocusedPanel {
  return value === 'sidebar' || value === 'list' || value === 'detail';
}

// ---------------------------------------------------------------------------
// State transition helpers
// ---------------------------------------------------------------------------

/** Shift focus one panel to the left (detail → list → sidebar). */
export function moveFocusLeft(panel: FocusedPanel): FocusedPanel {
  if (panel === 'detail') return 'list';
  if (panel === 'list') return 'sidebar';
  return 'sidebar';
}

/** Shift focus one panel to the right (sidebar → list → detail). */
export function moveFocusRight(panel: FocusedPanel): FocusedPanel {
  if (panel === 'sidebar') return 'list';
  if (panel === 'list') return 'detail';
  return 'detail';
}

/** Advance the selected index forward, wrapping at the end of the list. */
export function nextIndex(current: number, total: number): number {
  if (total === 0) return -1;
  if (current < 0) return 0;
  return (current + 1) % total;
}

/** Move the selected index backward, wrapping at the start of the list. */
export function prevIndex(current: number, total: number): number {
  if (total === 0) return -1;
  if (current <= 0) return total - 1;
  return (current - 1 + total) % total;
}
