import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { BeanScript } from '../types/beans';

/** Where the menu should appear. */
export interface MenuAnchor {
  x: number;
  y: number;
}

interface BeanActionMenuProps {
  open: boolean;
  /** Viewport coordinates of the menu's top-left corner. */
  anchor: MenuAnchor | null;
  /** Title of the bean the menu is acting on, shown as a header. */
  beanTitle: string;
  scripts: BeanScript[];
  loading: boolean;
  /** Resolved scripts directories, shown when no scripts were found. */
  scriptsDirs: string[];
  onEditExternal: () => void;
  onRun: (scriptId: string) => void;
  onClose: () => void;
}

/** Approximate rendered size, used only to keep the menu inside the viewport. */
const MENU_WIDTH = 288;
const MENU_MAX_HEIGHT = 360;
const VIEWPORT_MARGIN = 8;

/** The always-present first entry. Not a script, so it needs a reserved id. */
const EDIT_ITEM_ID = '__edit_external__';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  /** Single-character accelerator, or null. */
  key: string | null;
  /** Badge text shown on the right; `null` for the pinned edit entry. */
  badge: string | null;
}

/**
 * Keep the menu fully on screen when opened near a right or bottom edge.
 */
function clampToViewport(anchor: MenuAnchor): { left: number; top: number } {
  const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN);
  const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - MENU_MAX_HEIGHT - VIEWPORT_MARGIN);
  return {
    left: Math.min(Math.max(anchor.x, VIEWPORT_MARGIN), maxLeft),
    top: Math.min(Math.max(anchor.y, VIEWPORT_MARGIN), maxTop),
  };
}

/**
 * Contextual action menu for a bean, opened with `Space` or a right-click.
 *
 * "Edit (external)" is pinned first so the menu always has a useful default,
 * followed by the scripts discovered for the active project.
 *
 * Navigation mirrors ParentBeanSelect (arrow keys, Enter, Escape) and adds
 * vim-style `j`/`k`. Key events are stopped at the menu rather than allowed to
 * reach the document, because the global bindings in useKeyboardNav also use
 * `j`/`k` and would move the list selection underneath the open menu.
 */
export function BeanActionMenu({
  open,
  anchor,
  beanTitle,
  scripts,
  loading,
  scriptsDirs,
  onEditExternal,
  onRun,
  onClose,
}: BeanActionMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const items = useMemo<MenuItem[]>(
    () => [
      {
        id: EDIT_ITEM_ID,
        name: 'Edit (external)',
        description: 'Open this bean in your configured editor',
        key: null,
        badge: null,
      },
      ...scripts.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        key: s.key,
        // Only project scripts are badged; global is the unremarkable default.
        badge: s.scope === 'project' ? 'project' : null,
      })),
    ],
    [scripts]
  );

  const runItem = useCallback(
    (item: MenuItem | undefined) => {
      if (!item) return;
      onClose();
      if (item.id === EDIT_ITEM_ID) onEditExternal();
      else onRun(item.id);
    },
    [onClose, onEditExternal, onRun]
  );

  // Reset the highlight each time the menu opens.
  useEffect(() => {
    if (open) setActiveIndex(0);
  }, [open]);

  // Take focus so the menu, not the document, receives key events.
  useEffect(() => {
    if (open) containerRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open) itemRefs.current[activeIndex]?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Every handled key is stopped here so the global j/k/Escape bindings
      // never see it while the menu is open.
      const stop = () => {
        e.preventDefault();
        e.stopPropagation();
      };

      if (e.key === 'Escape') {
        stop();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        stop();
        setActiveIndex((i) => Math.min(i + 1, items.length - 1));
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'k') {
        stop();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Home' || e.key === 'g') {
        stop();
        setActiveIndex(0);
        return;
      }
      if (e.key === 'End' || e.key === 'G') {
        stop();
        setActiveIndex(Math.max(items.length - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        stop();
        runItem(items[activeIndex]);
        return;
      }

      // Script-declared accelerators. Checked last so they cannot shadow
      // navigation keys.
      const accel = items.find((it) => it.key && it.key === e.key);
      if (accel) {
        stop();
        runItem(accel);
      }
    },
    [items, activeIndex, onClose, runItem]
  );

  if (!open || !anchor) return null;

  const { left, top } = clampToViewport(anchor);

  return (
    <div
      ref={containerRef}
      role="menu"
      aria-label={`Actions for ${beanTitle}`}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={{ left, top, width: MENU_WIDTH, maxHeight: MENU_MAX_HEIGHT }}
      className="fixed z-50 flex flex-col rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg focus:outline-none"
    >
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 truncate">
        {beanTitle}
      </div>

      <ul className="overflow-y-auto flex-1 py-1">
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <li
              key={item.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => runItem(item)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`w-full text-left px-3 py-1.5 text-sm ${
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="truncate flex-1 text-gray-800 dark:text-gray-200">
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-600 shrink-0">
                      {item.badge}
                    </span>
                  )}
                  {item.key && (
                    <kbd className="text-xs font-mono text-gray-400 dark:text-gray-600 shrink-0">
                      {item.key}
                    </kbd>
                  )}
                </span>
                {item.description && (
                  <span className="block text-xs text-gray-400 dark:text-gray-500 truncate">
                    {item.description}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {loading && (
        <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800">
          Loading scripts…
        </div>
      )}

      {!loading && scripts.length === 0 && (
        <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800">
          <div>No scripts found. Add an executable to:</div>
          {scriptsDirs.map((dir) => (
            <div key={dir} className="font-mono truncate mt-0.5">
              {dir}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
