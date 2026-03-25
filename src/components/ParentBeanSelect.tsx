import { useState, useRef, useEffect, useCallback } from 'react';
import type { Bean } from '../types/beans';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const excluded = excludeId ? collectDescendantIds(beans, excludeId) : new Set<string>();
  const flat = flattenBeans(beans).filter(b => !excluded.has(b.id));

  const selected = value ? flat.find(b => b.id === value) ?? null : null;

  const filtered = search.trim()
    ? flat.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.id.toLowerCase().includes(search.toLowerCase())
      )
    : flat;

  const handleSelect = useCallback((bean: Bean | null) => {
    onChange(bean ? bean.id : null);
    setSearch('');
    setOpen(false);
  }, [onChange]);

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
              onKeyDown={e => e.key === 'Escape' && setOpen(false)}
            />
          </div>
          <ul className="overflow-y-auto flex-1">
            {!search && (
              <li>
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  None
                </button>
              </li>
            )}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No results</li>
            )}
            {filtered.map(bean => (
              <li key={bean.file_path || bean.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(bean)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 ${
                    bean.id === value ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  <span className="truncate flex-1">{bean.title}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-600 font-mono shrink-0">{bean.id}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
