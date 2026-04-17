import { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import Fuse from 'fuse.js';
import type { Bean } from '../types/beans';

interface BeanListProps {
  beans: Bean[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  statusFilter?: string[];
  priorityFilter?: string[];
  tagFilter?: string[];
  onNewBean?: () => void;
  lastRefreshed?: number;
  /**
   * Keyboard-driven selected index (from useKeyboardNav). When set, the row
   * at this index in the flat visible list is highlighted even if selectedId
   * doesn't match yet (the two stay in sync via onFlatListChange).
   */
  keyboardSelectedIndex?: number;
  /**
   * Called whenever the flat visible list changes so the parent can keep an
   * up-to-date index → id mapping for keyboard navigation.
   */
  onFlatListChange?: (ids: string[]) => void;
  /**
   * Register an Escape handler with the keyboard nav system.
   * Priority 10 — clears search and blurs the search input.
   */
  registerEscapeHandler?: (priority: number, handler: () => boolean) => () => void;
  /**
   * Ref that BeanList populates with its toggleExpand function so the parent
   * can trigger expand/collapse via keyboard without prop-drilling state.
   */
  toggleExpandRef?: { current: ((id: string) => void) | undefined };
}

type SortColumn = 'title' | 'status' | 'date' | 'priority';
type SortDirection = 'asc' | 'desc';

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

// --- Status dot color helper ---
function statusDotClass(status: string): string {
  const s = status.toLowerCase();
  if (s === 'open') return 'bg-blue-500';
  if (s === 'in-progress' || s === 'in_progress' || s === 'inprogress') return 'bg-yellow-500';
  if (s === 'completed' || s === 'done') return 'bg-green-500';
  if (s === 'archived' || s === 'scrapped') return 'bg-gray-400';
  return 'bg-gray-400';
}

// --- Staleness check ---
// Critical: not updated within 12h; High: not updated within 48h
function isStale(bean: Bean): boolean {
  const s = bean.status?.toLowerCase();
  if (s === 'completed' || s === 'scrapped') return false;
  const p = bean.priority?.toLowerCase();
  if (p !== 'critical' && p !== 'high') return false;
  const dateStr = bean.updated_at ?? bean.created_at;
  if (!dateStr) return false;
  const ageMs = Date.now() - new Date(dateStr).getTime();
  const thresholdMs = p === 'critical' ? 12 * 60 * 60 * 1000 : 48 * 60 * 60 * 1000;
  return ageMs > thresholdMs;
}

// --- Priority badge color helper ---
function priorityBadgeClass(priority: string | null): string {
  switch (priority?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
    case 'high':     return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400';
    case 'low':      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400';
    case 'deferred': return 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500';
    default:         return '';
  }
}

// --- Flatten beans tree into rows with depth ---
interface FlatBean {
  bean: Bean;
  depth: number;
}

function flattenVisible(beans: Bean[], expanded: Map<string, boolean>, depth = 0): FlatBean[] {
  const result: FlatBean[] = [];
  for (const bean of beans) {
    result.push({ bean, depth });
    if (bean.children && bean.children.length > 0 && expanded.get(bean.id)) {
      result.push(...flattenVisible(bean.children, expanded, depth + 1));
    }
  }
  return result;
}

// --- Filter beans to those matching priority (OR logic, recursive) ---
function filterByPriority(beans: Bean[], priorities: string[]): Bean[] {
  if (priorities.length === 0) return beans;
  const lower = priorities.map((p) => p.toLowerCase());
  return beans.reduce<Bean[]>((acc, bean) => {
    const filteredChildren = filterByPriority(bean.children ?? [], priorities);
    const beanPriority = (bean.priority ?? 'normal').toLowerCase();
    if (lower.includes(beanPriority) || filteredChildren.length > 0) {
      acc.push({ ...bean, children: filteredChildren });
    }
    return acc;
  }, []);
}

// --- Collect all beans with matching status (including children) ---
function filterByStatus(beans: Bean[], statuses: string[]): Bean[] {
  if (statuses.length === 0) return beans;
  const lower = statuses.map((s) => s.toLowerCase());
  return beans.reduce<Bean[]>((acc, bean) => {
    const filteredChildren = filterByStatus(bean.children ?? [], statuses);
    if (lower.includes(bean.status.toLowerCase()) || filteredChildren.length > 0) {
      acc.push({ ...bean, children: filteredChildren });
    }
    return acc;
  }, []);
}

// --- Collect all unique tags across the full bean tree, sorted ---
export function collectTags(beans: Bean[]): string[] {
  const tags = new Set<string>();
  const visit = (list: Bean[]) => {
    for (const bean of list) {
      for (const tag of bean.tags ?? []) tags.add(tag);
      if (bean.children?.length) visit(bean.children);
    }
  };
  visit(beans);
  return Array.from(tags).sort();
}

// --- Filter beans to those possessing ALL active tags (AND logic) ---
export function filterByTags(beans: Bean[], tags: string[]): Bean[] {
  if (tags.length === 0) return beans;
  return beans.reduce<Bean[]>((acc, bean) => {
    const filteredChildren = filterByTags(bean.children ?? [], tags);
    const beanTags = bean.tags ?? [];
    const matches = tags.every((t) => beanTags.includes(t));
    if (matches || filteredChildren.length > 0) {
      acc.push({ ...bean, children: filteredChildren });
    }
    return acc;
  }, []);
}

// --- Priority sort weight ---
const PRIORITY_WEIGHT: Record<string, number> = {
  critical: 40,
  high: 30,
  normal: 20,
  low: 10,
};
function priorityWeight(p: string | null): number {
  return PRIORITY_WEIGHT[(p ?? '').toLowerCase()] ?? 0;
}

// --- Sort top-level beans ---
function sortBeans(beans: Bean[], sort: SortState): Bean[] {
  return [...beans].sort((a, b) => {
    let cmp = 0;
    if (sort.column === 'title') {
      cmp = (a.title || '').localeCompare(b.title || '');
    } else if (sort.column === 'status') {
      cmp = (a.status || '').localeCompare(b.status || '');
    } else if (sort.column === 'date') {
      const aDate = a.updated_at ?? a.created_at ?? a.id;
      const bDate = b.updated_at ?? b.created_at ?? b.id;
      cmp = aDate.localeCompare(bDate);
    } else if (sort.column === 'priority') {
      cmp = priorityWeight(a.priority) - priorityWeight(b.priority);
    }
    return sort.direction === 'asc' ? cmp : -cmp;
  });
}

// --- Format date string ---
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr.slice(0, 10);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr.slice(0, 10);
  }
}

// --- Chevron icon ---
function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <span
      className={[
        'inline-block transition-transform duration-150 text-gray-400 dark:text-gray-500 text-xs leading-none select-none',
        expanded ? 'rotate-90' : '',
      ].join(' ')}
      aria-hidden="true"
    >
      ▶
    </span>
  );
}

// --- Sort indicator ---
function SortArrow({ column, sort }: { column: SortColumn; sort: SortState }) {
  if (sort.column !== column) return <span className="opacity-30 ml-0.5">↕</span>;
  return <span className="ml-0.5">{sort.direction === 'asc' ? '↑' : '↓'}</span>;
}

// --- Main component ---
export const BeanList = memo(function BeanList({ beans, selectedId, onSelect, loading, statusFilter = [], priorityFilter = [], tagFilter = [], onNewBean, lastRefreshed, keyboardSelectedIndex, onFlatListChange, registerEscapeHandler, toggleExpandRef }: BeanListProps) {
  const [sort, setSort] = useState<SortState>({ column: 'date', direction: 'desc' });
  const [expanded, setExpanded] = useState<Map<string, boolean>>(new Map());
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showUpdated, setShowUpdated] = useState(false);
  const updatedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Register escape handler: when search is focused & non-empty, Escape clears and blurs it.
  const handleSearchEscape = useCallback((): boolean => {
    const input = searchInputRef.current ?? document.querySelector<HTMLInputElement>('[data-search-input]');
    if (input && document.activeElement === input) {
      setSearch('');
      input.blur();
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!registerEscapeHandler) return;
    return registerEscapeHandler(10, handleSearchEscape);
  }, [registerEscapeHandler, handleSearchEscape]);

  // Scroll the list so the keyboard-focused row stays visible
  useEffect(() => {
    if (keyboardSelectedIndex === undefined || keyboardSelectedIndex < 0) return;
    const ul = listRef.current;
    if (!ul) return;
    const items = ul.querySelectorAll<HTMLLIElement>(':scope > li');
    const target = items[keyboardSelectedIndex];
    if (target) target.scrollIntoView({ block: 'nearest' });
  }, [keyboardSelectedIndex]);

  // Show the "Updated" indicator whenever lastRefreshed changes (but not on initial mount)
  const prevLastRefreshed = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (lastRefreshed === undefined) return;
    if (prevLastRefreshed.current === undefined) {
      prevLastRefreshed.current = lastRefreshed;
      return;
    }
    if (lastRefreshed !== prevLastRefreshed.current) {
      prevLastRefreshed.current = lastRefreshed;
      setShowUpdated(true);
      if (updatedTimerRef.current) clearTimeout(updatedTimerRef.current);
      updatedTimerRef.current = setTimeout(() => setShowUpdated(false), 1600);
    }
  }, [lastRefreshed]);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Toggle expand/collapse — stable ref, exposed to parent via toggleExpandRef
  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Map(prev);
      next.set(id, !prev.get(id));
      return next;
    });
  }, []);

  useEffect(() => {
    if (toggleExpandRef) toggleExpandRef.current = toggleExpand;
  }, [toggleExpandRef, toggleExpand]);

  // Toggle sort column
  function handleSort(col: SortColumn) {
    setSort((prev) => {
      if (prev.column === col) {
        return { column: col, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column: col, direction: col === 'date' ? 'desc' : 'asc' };
    });
  }

  // Apply status filter
  const statusFiltered = useMemo(() => filterByStatus(beans, statusFilter), [beans, statusFilter]);

  // Apply priority filter
  const priorityFiltered = useMemo(() => filterByPriority(statusFiltered, priorityFilter), [statusFiltered, priorityFilter]);

  // Apply tag filter
  const tagFiltered = useMemo(() => filterByTags(priorityFiltered, tagFilter), [priorityFiltered, tagFilter]);

  // Flatten tree for Fuse indexing (includes children at all depths)
  const flatForSearch = useMemo(() => {
    const out: Bean[] = [];
    function collect(list: Bean[]) {
      for (const b of list) {
        out.push(b);
        if (b.children?.length) collect(b.children);
      }
    }
    collect(tagFiltered);
    return out;
  }, [tagFiltered]);

  // Build Fuse index whenever the flat list changes
  const fuseIndex = useMemo(() => new Fuse(flatForSearch, {
    threshold: 0.35,
    ignoreLocation: true,
    keys: [
      { name: 'title', weight: 3 },
      { name: 'id',    weight: 2 },
      { name: 'body',  weight: 1 },
    ],
  }), [flatForSearch]);

  // Apply fuzzy search — keep a bean if it or any descendant matches
  const searchFiltered = useMemo(() => {
    const q = debouncedSearch.trim();
    if (!q) return tagFiltered;
    const matchedIds = new Set(fuseIndex.search(q).map((r) => r.item.id));
    function keepBean(bean: Bean): Bean | null {
      const filteredChildren = (bean.children ?? []).reduce<Bean[]>((acc, child) => {
        const m = keepBean(child);
        if (m) acc.push(m);
        return acc;
      }, []);
      if (matchedIds.has(bean.id) || filteredChildren.length > 0) {
        return { ...bean, children: filteredChildren };
      }
      return null;
    }
    return tagFiltered.reduce<Bean[]>((acc, bean) => {
      const m = keepBean(bean);
      if (m) acc.push(m);
      return acc;
    }, []);
  }, [tagFiltered, debouncedSearch, fuseIndex]);

  // Sort top-level beans
  const sorted = useMemo(() => sortBeans(searchFiltered, sort), [searchFiltered, sort]);

  // Flatten with expand state
  const flatRows = useMemo(() => flattenVisible(sorted, expanded), [sorted, expanded]);

  // Notify parent whenever the flat visible list changes (for keyboard nav index→id mapping)
  const onFlatListChangeRef = useRef(onFlatListChange);
  onFlatListChangeRef.current = onFlatListChange;
  useEffect(() => {
    if (onFlatListChangeRef.current) {
      onFlatListChangeRef.current(flatRows.map((r) => r.bean.id));
    }
  }, [flatRows]);

  // Count totals
  const totalCount = useMemo(() => {
    function countAll(bs: Bean[]): number {
      return bs.reduce((n, b) => n + 1 + countAll(b.children ?? []), 0);
    }
    return countAll(tagFiltered);
  }, [tagFiltered]);

  const filteredCount = useMemo(() => {
    function countAll(bs: Bean[]): number {
      return bs.reduce((n, b) => n + 1 + countAll(b.children ?? []), 0);
    }
    return countAll(searchFiltered);
  }, [searchFiltered]);

  const hasSearch = search.trim().length > 0;
  const countLabel = hasSearch
    ? `${filteredCount} of ${totalCount} beans`
    : `${totalCount} beans`;

  // Collect IDs of all visible beans that have children
  const idsWithChildren = useMemo(() => {
    const ids: string[] = [];
    function collect(list: Bean[]) {
      for (const b of list) {
        if (b.children?.length) { ids.push(b.id); collect(b.children); }
      }
    }
    collect(sorted);
    return ids;
  }, [sorted]);

  const allExpanded = idsWithChildren.length > 0 && idsWithChildren.every((id) => expanded.get(id));

  const handleExpandCollapseAll = useCallback(() => {
    if (allExpanded) {
      setExpanded(new Map());
    } else {
      setExpanded(new Map(idsWithChildren.map((id) => [id, true])));
    }
  }, [allExpanded, idsWithChildren]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        {/* Skeleton search bar */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="h-7 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>
        {/* Skeleton column headers */}
        <div className="h-8 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0" />
        {/* Skeleton rows */}
        <div className="flex flex-col gap-2 p-3">
          {[75, 55, 90, 65].map((width, i) => (
            <div key={i} className="flex items-center gap-3 py-1">
              <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
              <div
                className="h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"
                style={{ width: `${width}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Refresh indicator bar */}
      {showUpdated && (
        <div
          key={lastRefreshed}
          style={{ animation: 'fadeOut 1.5s ease-out forwards' }}
          className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400 dark:bg-blue-500 z-10 pointer-events-none"
          aria-live="polite"
          aria-label="List updated"
        />
      )}
      {/* Search bar */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search beans..."
            data-search-input
            className="w-full text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-600"
          />
          {hasSearch && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-base leading-none"
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">{countLabel}</span>
          {idsWithChildren.length > 0 && (
            <button
              onClick={handleExpandCollapseAll}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={allExpanded ? 'Collapse all' : 'Expand all'}
            >
              {allExpanded ? '⊖ collapse all' : '⊕ expand all'}
            </button>
          )}
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center px-3 py-1.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 select-none">
        {/* Chevron placeholder */}
        <span className="w-5 shrink-0" />
        {/* Status dot placeholder */}
        <span className="w-4 shrink-0" />
        <button
          onClick={() => handleSort('title')}
          className="flex-1 text-left hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Title <SortArrow column="title" sort={sort} />
        </button>
        <button
          onClick={() => handleSort('priority')}
          className="w-20 shrink-0 text-left hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Priority <SortArrow column="priority" sort={sort} />
        </button>
        <button
          onClick={() => handleSort('status')}
          className="w-20 text-left hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Status <SortArrow column="status" sort={sort} />
        </button>
        <button
          onClick={() => handleSort('date')}
          className="w-24 text-right hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Updated <SortArrow column="date" sort={sort} />
        </button>
      </div>

      {/* Bean rows */}
      {flatRows.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-gray-400 dark:text-gray-500">
          <span className="text-sm">{hasSearch ? 'No matching beans' : 'No beans found'}</span>
        </div>
      ) : (
        <ul ref={listRef} className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {flatRows.map(({ bean, depth }, rowIndex) => {
            const isSelected = !!bean.id && bean.id === selectedId;
            const isKeyboardFocused =
              keyboardSelectedIndex !== undefined && keyboardSelectedIndex === rowIndex;
            const hasChildren = bean.children && bean.children.length > 0;
            const isExpanded = !!expanded.get(bean.id);

            return (
              <li key={bean.file_path || `${bean.id}-${depth}`}>
                <button
                  onClick={() => onSelect(bean.id)}
                  className={[
                    'w-full text-left flex flex-col pr-3 py-1.5 transition-colors',
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950 border-l-2 border-blue-500 pl-2'
                      : isKeyboardFocused
                        ? 'bg-gray-100 dark:bg-gray-800 border-l-2 border-gray-400 dark:border-gray-500 pl-2'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-transparent pl-2',
                  ].join(' ')}
                  style={{ paddingLeft: `${0.5 + depth * 1.5}rem` }}
                >
                  {/* Top row */}
                  <div className="flex items-center gap-1 w-full">
                    {/* Chevron */}
                    <span
                      className="w-4 shrink-0 flex items-center justify-center"
                      onClick={
                        hasChildren
                          ? (e) => {
                              e.stopPropagation();
                              toggleExpand(bean.id);
                            }
                          : undefined
                      }
                    >
                      {hasChildren && <Chevron expanded={isExpanded} />}
                    </span>

                    {/* Status dot */}
                    <span
                      className={[
                        'w-2 h-2 rounded-full shrink-0',
                        statusDotClass(bean.status),
                      ].join(' ')}
                      title={bean.status}
                    />

                    {/* Title */}
                    <span
                      className={[
                        'flex-1 text-sm font-medium truncate ml-1.5',
                        isSelected
                          ? 'text-blue-900 dark:text-blue-100'
                          : 'text-gray-900 dark:text-gray-100',
                      ].join(' ')}
                    >
                      {bean.title || '(untitled)'}
                    </span>

                    {/* Priority (fixed width, 3rd column) */}
                    <span className="w-20 shrink-0">
                      {bean.priority ? (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${priorityBadgeClass(bean.priority)}${isStale(bean) ? ' stale-pulse' : ''}`}>
                          {bean.priority}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </span>

                    {/* Status label (muted, fixed width) */}
                    <span className="w-20 text-xs text-gray-400 dark:text-gray-500 truncate capitalize shrink-0">
                      {bean.status}
                    </span>

                    {/* Date (muted, fixed width, right-aligned) */}
                    <span className="w-24 text-xs text-gray-400 dark:text-gray-500 text-right shrink-0">
                      {formatDate(bean.updated_at ?? bean.created_at)}
                    </span>
                  </div>

                  {/* Sub-row: tags (only when tags exist) */}
                  {bean.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pl-7 mt-0.5">
                      {bean.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 leading-4 truncate max-w-[80px]"
                        >
                          #{tag}
                        </span>
                      ))}
                      {bean.tags.length > 3 && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          +{bean.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* New Bean button */}
      {onNewBean && (
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={onNewBean}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            + New Bean
          </button>
        </div>
      )}
    </div>
  );
});
