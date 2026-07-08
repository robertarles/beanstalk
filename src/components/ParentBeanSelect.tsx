import { useState, useRef, useEffect, useCallback } from 'react';
import type { Bean } from '../types/beans';
import { fuzzyFilterItems } from '../lib/fuzzy';

interface ParentBeanSelectProps {
  beans: Bean[];
  value: string | null;
  onChange: (parentId: string | null) => void;
  excludeId?: string; // exclude the current bean and its descendants
}

/** Flatten a bean tree into a flat list. */
function flattenBeans(beans: Bean[]): Bean[] {
  const result: Bean[] = [];
  function walk(nodes: Bean[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children.length > 0) walk(node.children);
    }
  }
  walk(beans);
  return result;
}

/** Collect the id of a bean and all its descendants. */
function collectDescendantIds(beans: Bean[], rootId: string): Set<string> {
  const ids = new Set<string>();
  function findAndCollect(nodes: Bean[]): boolean {
    for (const node of nodes) {
      if (node.id === rootId) {
        ids.add(node.id);
        function addAll(ns: Bean[]) {
          for (const n of ns) { ids.add(n.id); addAll(n.children); }
        }
        addAll(node.children);
        return true;
      }
      if (findAndCollect(node.children)) return true;
    }
    return false;
  }
  findAndCollect(beans);
  return ids;
}

export function ParentBeanSelect({ beans, value, onChange, excludeId }: ParentBeanSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const excluded = excludeId ? collectDescendantIds(beans, excludeId) : new Set<string>();
  const flat = flattenBeans(beans).filter(b => !excluded.has(b.id));

  const selected = value ? flat.find(b => b.id === value) ?? null : null;

  const filtered = search.trim()
    ? fuzzyFilterItems(flat, search, b => [b.title, b.id])
    : flat;

  // Navigable option list. When not searching, the "None" option (null) leads
  // the list so it is reachable via the keyboard too.
  const options: (Bean | null)[] = search.trim() ? filtered : [null, ...filtered];

  const handleSelect = useCallback((bean: Bean | null) => {
    onChange(bean ? bean.id : null);
    setSearch('');
    setOpen(false);
  }, [onChange]);

  // Reset the highlighted option whenever the dropdown opens or the query changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [open, search]);

  // Keep the highlighted option scrolled into view as the user arrows through.
  useEffect(() => {
    if (open) itemRefs.current[activeIndex]?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, open]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (options.length > 0) handleSelect(options[Math.min(activeIndex, options.length - 1)]);
    }
  }, [options, activeIndex, handleSelect]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const baseClass =
    'w-full text-sm px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`${baseClass} text-left flex items-center justify-between`}
      >
        <span className={selected ? '' : 'text-gray-400 dark:text-gray-500'}>
          {selected ? selected.title : 'None'}
        </span>
        <span className="text-gray-400 ml-2">▾</span>
      </button>

      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={() => handleSelect(null)}
          className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-1"
          title="Clear parent"
        >
          ✕
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg max-h-56 flex flex-col">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search beans..."
              className="w-full text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={handleKeyDown}
            />
          </div>
          <ul className="overflow-y-auto flex-1">
            {options.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No results</li>
            )}
            {options.map((bean, index) => {
              const isActive = index === activeIndex;
              const isNone = bean === null;
              return (
                <li key={isNone ? '__none__' : bean.file_path || bean.id} ref={el => { itemRefs.current[index] = el; }}>
                  <button
                    type="button"
                    onClick={() => handleSelect(bean)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={
                      isNone
                        ? `w-full text-left px-3 py-2 text-sm text-gray-400 dark:text-gray-500 ${isActive ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`
                        : `w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                            isActive ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          } ${
                            bean.id === value ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'
                          }`
                    }
                  >
                    {isNone ? (
                      'None'
                    ) : (
                      <>
                        <span className="truncate flex-1">{bean.title}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-600 font-mono shrink-0">{bean.id}</span>
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
