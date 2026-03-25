import { useState, useMemo, useEffect, useRef, memo } from 'react';
import type { Bean } from '../types/beans';

interface BeanListProps {
  beans: Bean[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
  statusFilter?: string | null;
  onNewBean?: () => void;
  lastRefreshed?: number;
}

type SortColumn = 'title' | 'status' | 'date';
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
  if (s === 'done') return 'bg-green-500';
  if (s === 'archived') return 'bg-gray-400';
  return 'bg-gray-400';
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

// --- Collect all beans with matching status (including children) ---
function filterByStatus(beans: Bean[], status: string | null): Bean[] {
  if (!status) return beans;
  return beans.reduce<Bean[]>((acc, bean) => {
    const filteredChildren = filterByStatus(bean.children ?? [], status);
    if (bean.status.toLowerCase() === status.toLowerCase() || filteredChildren.length > 0) {
      acc.push({ ...bean, children: filteredChildren });
    }
    return acc;
  }, []);
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
      const aDate = a.created_at ?? a.id;
      const bDate = b.created_at ?? b.id;
      cmp = aDate.localeCompare(bDate);
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
export const BeanList = memo(function BeanList({ beans, selectedId, onSelect, loading, statusFilter = null, onNewBean, lastRefreshed }: BeanListProps) {
  const [sort, setSort] = useState<SortState>({ column: 'date', direction: 'desc' });
  const [expanded, setExpanded] = useState<Map<string, boolean>>(new Map());
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showUpdated, setShowUpdated] = useState(false);
  const updatedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Toggle expand/collapse
  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Map(prev);
      next.set(id, !prev.get(id));
      return next;
    });
  }

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

  // Apply search filter (client-side, title + id match)
  const searchFiltered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return statusFiltered;
    function matchBean(bean: Bean): Bean | null {
      const titleMatch = (bean.title || '').toLowerCase().includes(q);
      const idMatch = bean.id.toLowerCase().includes(q);
      const filteredChildren = (bean.children ?? []).reduce<Bean[]>((acc, child) => {
        const m = matchBean(child);
        if (m) acc.push(m);
        return acc;
      }, []);
      if (titleMatch || idMatch || filteredChildren.length > 0) {
        return { ...bean, children: filteredChildren };
      }
      return null;
    }
    return statusFiltered.reduce<Bean[]>((acc, bean) => {
      const m = matchBean(bean);
      if (m) acc.push(m);
      return acc;
    }, []);
  }, [statusFiltered, debouncedSearch]);

  // Sort top-level beans
  const sorted = useMemo(() => sortBeans(searchFiltered, sort), [searchFiltered, sort]);

  // Flatten with expand state
  const flatRows = useMemo(() => flattenVisible(sorted, expanded), [sorted, expanded]);

  // Count totals
  const totalCount = useMemo(() => {
    function countAll(bs: Bean[]): number {
      return bs.reduce((n, b) => n + 1 + countAll(b.children ?? []), 0);
    }
    return countAll(statusFiltered);
  }, [statusFiltered]);

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
        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">{countLabel}</div>
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
          onClick={() => handleSort('status')}
          className="w-20 text-left hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Status <SortArrow column="status" sort={sort} />
        </button>
        <button
          onClick={() => handleSort('date')}
          className="w-24 text-right hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Date <SortArrow column="date" sort={sort} />
        </button>
      </div>

      {/* Bean rows */}
      {flatRows.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-gray-400 dark:text-gray-500">
          <span className="text-sm">{hasSearch ? 'No matching beans' : 'No beans found'}</span>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {flatRows.map(({ bean, depth }) => {
            const isSelected = !!bean.id && bean.id === selectedId;
            const hasChildren = bean.children && bean.children.length > 0;
            const isExpanded = !!expanded.get(bean.id);

            return (
              <li key={bean.file_path || `${bean.id}-${depth}`}>
                <button
                  onClick={() => onSelect(bean.id)}
                  className={[
                    'w-full text-left flex items-center gap-1 pr-3 py-2 transition-colors',
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950 border-l-2 border-blue-500 pl-2'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-2 border-transparent pl-2',
                  ].join(' ')}
                  style={{ paddingLeft: `${0.5 + depth * 1.5}rem` }}
                >
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

                  {/* Status label (muted, fixed width) */}
                  <span className="w-20 text-xs text-gray-400 dark:text-gray-500 truncate capitalize shrink-0">
                    {bean.status}
                  </span>

                  {/* Date (muted, fixed width, right-aligned) */}
                  <span className="w-24 text-xs text-gray-400 dark:text-gray-500 text-right shrink-0">
                    {formatDate(bean.created_at)}
                  </span>
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
