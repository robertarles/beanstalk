import { useState, useRef, useEffect, useCallback } from 'react';
import type { Bean } from '../types/beans';

interface RelatedBeansSelectProps {
  beans: Bean[];
  value: string[];
  onChange: (ids: string[]) => void;
  excludeId?: string;
  placeholder?: string;
}

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

export function RelatedBeansSelect({
  beans,
  value,
  onChange,
  excludeId,
  placeholder = 'Add bean...',
}: RelatedBeansSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const flat = flattenBeans(beans).filter(b => b.id !== excludeId && !value.includes(b.id));

  const filtered = search.trim()
    ? flat.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.id.toLowerCase().includes(search.toLowerCase())
      )
    : flat;

  const handleAdd = useCallback((bean: Bean) => {
    onChange([...value, bean.id]);
    setSearch('');
    setOpen(false);
  }, [value, onChange]);

  const handleRemove = useCallback((id: string) => {
    onChange(value.filter(v => v !== id));
  }, [value, onChange]);

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

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const allFlat = flattenBeans(beans);
  const selectedBeans = value.map(id => allFlat.find(b => b.id === id)).filter(Boolean) as Bean[];

  const baseInputClass =
    'w-full text-sm px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      {/* Selected tags */}
      {selectedBeans.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedBeans.map(bean => (
            <span
              key={bean.id}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
            >
              <span className="truncate max-w-[160px]">{bean.title}</span>
              <button
                type="button"
                onClick={() => handleRemove(bean.id)}
                className="hover:text-blue-900 dark:hover:text-blue-100 ml-0.5"
                title={`Remove ${bean.id}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger / search button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`${baseInputClass} text-left text-gray-400 dark:text-gray-500`}
      >
        {placeholder}
        <span className="float-right text-gray-400">▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg max-h-56 flex flex-col" style={{ top: selectedBeans.length > 0 ? 'auto' : '100%' }}>
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
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No results</li>
            )}
            {filtered.map(bean => (
              <li key={bean.id}>
                <button
                  type="button"
                  onClick={() => handleAdd(bean)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-gray-800 dark:text-gray-200"
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
