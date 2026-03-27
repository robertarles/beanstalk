import { useState, useEffect, useRef, useCallback } from 'react';
// tinykeys package.json "exports" lacks a "types" condition, so we import
// from the explicit dist path to satisfy TypeScript's module resolver.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolved correctly at runtime; types live at dist/tinykeys.d.ts
import { tinykeys } from 'tinykeys/dist/tinykeys.js';
import type { FocusedPanel, KeyboardNavState, EscapeHandler } from '../types/keyboard';
import { moveFocusLeft, moveFocusRight, nextIndex, prevIndex } from '../types/keyboard';

// ---------------------------------------------------------------------------
// Input guard
// ---------------------------------------------------------------------------

function isInputTarget(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Hook interface
// ---------------------------------------------------------------------------

export interface UseKeyboardNavOptions {
  /** Total number of visible (flat) beans in the list. */
  beanCount: number;
  /** Called when j/k navigation changes the selected index. */
  onSelectIndex: (index: number) => void;
  /** Called when `i` is pressed — open selected bean in external editor. */
  onOpenInEditor?: () => void;
  /** Called when `e` is pressed — enter edit mode for selected bean. */
  onEnterEditMode?: () => void;
  /** Called when `n` is pressed — open the new-bean form. */
  onNewBean?: () => void;
  /** Called when `s` is pressed — cycle the selected bean's status. */
  onCycleStatus?: () => void;
  /** Called when `y` is pressed — copy selected bean ID to clipboard. */
  onCopyId?: () => void;
}

export interface UseKeyboardNavResult {
  focusedPanel: FocusedPanel;
  setFocusedPanel: (panel: FocusedPanel) => void;
  selectedBeanIndex: number;
  setSelectedBeanIndex: (index: number) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  /** Register a handler for the Escape key. Returns an unregister function. */
  registerEscapeHandler: (priority: number, handler: () => boolean) => () => void;
  /** Unregister a previously registered Escape handler by reference. */
  unregisterEscapeHandler: (handler: () => boolean) => void;
  /** Current pending key state (e.g. 'g' while waiting for 'gg'). */
  pendingKey: string | null;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export function useKeyboardNav({
  beanCount,
  onSelectIndex,
  onOpenInEditor,
  onEnterEditMode,
  onNewBean,
  onCycleStatus,
  onCopyId,
}: UseKeyboardNavOptions): UseKeyboardNavResult {
  const [state, setState] = useState<KeyboardNavState>({
    focusedPanel: 'list',
    selectedBeanIndex: -1,
    isModalOpen: false,
    pendingKey: null,
  });

  // Mutable refs so tinykeys callbacks always see current values without
  // needing to re-subscribe on every state change.
  const stateRef = useRef(state);
  stateRef.current = state;

  const beanCountRef = useRef(beanCount);
  beanCountRef.current = beanCount;

  const onSelectIndexRef = useRef(onSelectIndex);
  onSelectIndexRef.current = onSelectIndex;

  const onOpenInEditorRef = useRef(onOpenInEditor);
  onOpenInEditorRef.current = onOpenInEditor;

  const onEnterEditModeRef = useRef(onEnterEditMode);
  onEnterEditModeRef.current = onEnterEditMode;

  const onNewBeanRef = useRef(onNewBean);
  onNewBeanRef.current = onNewBean;

  const onCycleStatusRef = useRef(onCycleStatus);
  onCycleStatusRef.current = onCycleStatus;

  const onCopyIdRef = useRef(onCopyId);
  onCopyIdRef.current = onCopyId;

  // Escape handler registry
  const escapeHandlersRef = useRef<EscapeHandler[]>([]);

  // Pending-key timeout handle for 'g g' sequence
  const pendingKeyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // Navigation actions (stable references, use refs internally)
  // ---------------------------------------------------------------------------

  const selectNext = useCallback(() => {
    const { selectedBeanIndex } = stateRef.current;
    const total = beanCountRef.current;
    const next = nextIndex(selectedBeanIndex, total);
    setState((s) => ({ ...s, selectedBeanIndex: next }));
    onSelectIndexRef.current(next);
  }, []);

  const selectPrevious = useCallback(() => {
    const { selectedBeanIndex } = stateRef.current;
    const total = beanCountRef.current;
    const prev = prevIndex(selectedBeanIndex, total);
    setState((s) => ({ ...s, selectedBeanIndex: prev }));
    onSelectIndexRef.current(prev);
  }, []);

  const focusLeft = useCallback(() => {
    setState((s) => ({ ...s, focusedPanel: moveFocusLeft(s.focusedPanel) }));
  }, []);

  const focusRight = useCallback(() => {
    setState((s) => ({ ...s, focusedPanel: moveFocusRight(s.focusedPanel) }));
  }, []);

  const jumpToFirst = useCallback(() => {
    const total = beanCountRef.current;
    if (total === 0) return;
    setState((s) => ({ ...s, selectedBeanIndex: 0, focusedPanel: 'list' }));
    onSelectIndexRef.current(0);
  }, []);

  const jumpToLast = useCallback(() => {
    const total = beanCountRef.current;
    if (total === 0) return;
    const last = total - 1;
    setState((s) => ({ ...s, selectedBeanIndex: last, focusedPanel: 'list' }));
    onSelectIndexRef.current(last);
  }, []);

  const focusSearch = useCallback(() => {
    const input = document.querySelector<HTMLInputElement>('[data-search-input]');
    input?.focus();
  }, []);

  const openInEditor = useCallback(() => {
    onOpenInEditorRef.current?.();
  }, []);

  const enterEditMode = useCallback(() => {
    onEnterEditModeRef.current?.();
  }, []);

  const newBean = useCallback(() => {
    onNewBeanRef.current?.();
  }, []);

  const cycleStatus = useCallback(() => {
    onCycleStatusRef.current?.();
  }, []);

  const copyId = useCallback(() => {
    onCopyIdRef.current?.();
  }, []);

  // ---------------------------------------------------------------------------
  // Escape handler management
  // ---------------------------------------------------------------------------

  const registerEscapeHandler = useCallback(
    (priority: number, handler: () => boolean): (() => void) => {
      const entry: EscapeHandler = { priority, handler };
      escapeHandlersRef.current = [...escapeHandlersRef.current, entry].sort(
        (a, b) => b.priority - a.priority
      );
      return () => {
        escapeHandlersRef.current = escapeHandlersRef.current.filter((e) => e !== entry);
      };
    },
    []
  );

  const unregisterEscapeHandler = useCallback((handler: () => boolean) => {
    escapeHandlersRef.current = escapeHandlersRef.current.filter(
      (e) => e.handler !== handler
    );
  }, []);

  const handleEscape = useCallback(() => {
    // Walk handlers in priority order; stop when one returns true
    for (const { handler } of escapeHandlersRef.current) {
      if (handler()) return;
    }
    // Default: deselect bean
    setState((s) => ({ ...s, selectedBeanIndex: -1 }));
    onSelectIndexRef.current(-1);
  }, []);

  // ---------------------------------------------------------------------------
  // Pending key helpers for 'g g' sequence
  // ---------------------------------------------------------------------------

  function clearPendingKey() {
    if (pendingKeyTimerRef.current) {
      clearTimeout(pendingKeyTimerRef.current);
      pendingKeyTimerRef.current = null;
    }
    setState((s) => ({ ...s, pendingKey: null }));
  }

  // ---------------------------------------------------------------------------
  // tinykeys subscription
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const unsub = tinykeys(document as unknown as Window, {
      j: (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        if (stateRef.current.isModalOpen) return;
        event.preventDefault();
        selectNext();
      },
      k: (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        if (stateRef.current.isModalOpen) return;
        event.preventDefault();
        selectPrevious();
      },
      h: (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        if (stateRef.current.isModalOpen) return;
        event.preventDefault();
        focusLeft();
      },
      l: (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        if (stateRef.current.isModalOpen) return;
        event.preventDefault();
        focusRight();
      },
      g: (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        if (stateRef.current.isModalOpen) return;
        event.preventDefault();
        const { pendingKey } = stateRef.current;
        if (pendingKey === 'g') {
          // 'g g' sequence — jump to first
          clearPendingKey();
          jumpToFirst();
        } else {
          // Start waiting for second 'g'
          setState((s) => ({ ...s, pendingKey: 'g' }));
          if (pendingKeyTimerRef.current) clearTimeout(pendingKeyTimerRef.current);
          pendingKeyTimerRef.current = setTimeout(() => {
            setState((s) => ({ ...s, pendingKey: null }));
            pendingKeyTimerRef.current = null;
          }, 500);
        }
      },
      G: (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        if (stateRef.current.isModalOpen) return;
        event.preventDefault();
        clearPendingKey();
        jumpToLast();
      },
      '?': (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        event.preventDefault();
        setState((s) => ({ ...s, isModalOpen: !s.isModalOpen }));
      },
      '/': (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        if (stateRef.current.isModalOpen) return;
        event.preventDefault();
        focusSearch();
      },
      i: (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        if (stateRef.current.isModalOpen) return;
        event.preventDefault();
        openInEditor();
      },
      e: (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        if (stateRef.current.isModalOpen) return;
        event.preventDefault();
        enterEditMode();
      },
      n: (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        if (stateRef.current.isModalOpen) return;
        event.preventDefault();
        newBean();
      },
      s: (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        if (stateRef.current.isModalOpen) return;
        event.preventDefault();
        cycleStatus();
      },
      y: (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        if (stateRef.current.isModalOpen) return;
        event.preventDefault();
        copyId();
      },
      'Control+f': (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        if (stateRef.current.isModalOpen) return;
        if (stateRef.current.focusedPanel !== 'detail') return;
        event.preventDefault();
        const aside = document.querySelector<HTMLElement>('[data-detail-panel]');
        if (aside) aside.scrollBy({ top: window.innerHeight / 2, behavior: 'smooth' });
      },
      'Control+b': (event: KeyboardEvent) => {
        if (isInputTarget(event)) return;
        if (stateRef.current.isModalOpen) return;
        if (stateRef.current.focusedPanel !== 'detail') return;
        event.preventDefault();
        const aside = document.querySelector<HTMLElement>('[data-detail-panel]');
        if (aside) aside.scrollBy({ top: -(window.innerHeight / 2), behavior: 'smooth' });
      },
      Escape: (event: KeyboardEvent) => {
        // Allow Escape to propagate from inputs (let them handle it) but also
        // run our chain so modal/edit layers can close.
        event.preventDefault();
        handleEscape();
      },
    });

    return () => {
      unsub();
      if (pendingKeyTimerRef.current) {
        clearTimeout(pendingKeyTimerRef.current);
      }
    };
  }, [selectNext, selectPrevious, focusLeft, focusRight, jumpToFirst, jumpToLast, handleEscape, focusSearch, openInEditor, enterEditMode, newBean, cycleStatus, copyId]);

  // ---------------------------------------------------------------------------
  // Stable setters
  // ---------------------------------------------------------------------------

  const setFocusedPanel = useCallback((panel: FocusedPanel) => {
    setState((s) => ({ ...s, focusedPanel: panel }));
  }, []);

  const setSelectedBeanIndex = useCallback((index: number) => {
    setState((s) => ({ ...s, selectedBeanIndex: index }));
  }, []);

  const setIsModalOpen = useCallback((open: boolean) => {
    setState((s) => ({ ...s, isModalOpen: open }));
  }, []);

  return {
    focusedPanel: state.focusedPanel,
    setFocusedPanel,
    selectedBeanIndex: state.selectedBeanIndex,
    setSelectedBeanIndex,
    isModalOpen: state.isModalOpen,
    setIsModalOpen,
    registerEscapeHandler,
    unregisterEscapeHandler,
    pendingKey: state.pendingKey,
  };
}
