import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Bean, ProjectPrefix } from '../types/beans';
import { useBeanChoices, type BeanChoice } from '../hooks/useBeanChoices';
import { BeanChoiceList } from './BeanChoiceList';

interface RelatedBeansSelectProps {
  beans: Bean[];
  value: string[];
  onChange: (ids: string[]) => void;
  excludeId?: string;
  placeholder?: string;
  /**
   * Configured projects other than the active one. Supplying them makes the
   * picker cross-project: their beans are offered once the user searches.
   */
  otherProjects?: ProjectPrefix[];
}

export function RelatedBeansSelect({
  beans,
  value,
  onChange,
  excludeId,
  placeholder = 'Add bean...',
  otherProjects = [],
}: RelatedBeansSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const exclude = useMemo(
    () => (excludeId ? [...value, excludeId] : value),
    [value, excludeId]
  );

  const { choices, loading } = useBeanChoices({
    beans,
    otherProjects,
    query: search,
    active: open,
    exclude,
  });

  // Every offerable bean, ignoring the search, so a selected chip can be labelled.
  const { choices: allChoices } = useBeanChoices({
    beans,
    otherProjects,
    query: '',
    active: false,
  });

  const handleAdd = useCallback(
    (id: string) => {
      onChange([...value, id]);
      setSearch('');
      setOpen(false);
    },
    [value, onChange]
  );

  const handleRemove = useCallback(
    (id: string) => {
      onChange(value.filter((v) => v !== id));
    },
    [value, onChange]
  );

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

  /**
   * The chips for already-selected ids.
   *
   * A selected id may not be among the loaded choices — a cross-project relation
   * read back from frontmatter before that project's beans have been fetched, for
   * instance. Fall back to showing the raw id rather than dropping the chip, which
   * would hide a relation that is really still set.
   */
  const selectedChoices = useMemo<BeanChoice[]>(
    () => value.map((id) => allChoices.find((c) => c.id === id) ?? { id, title: id }),
    [value, allChoices]
  );

  const baseInputClass =
    'w-full text-sm px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      {/* Selected tags */}
      {selectedChoices.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedChoices.map((choice) => (
            <span
              key={choice.id}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
            >
              {choice.projectName && (
                <span className="text-[10px] uppercase tracking-wide opacity-70 shrink-0">
                  {choice.projectName}
                </span>
              )}
              <span className="truncate max-w-[160px]">{choice.title}</span>
              <button
                type="button"
                onClick={() => handleRemove(choice.id)}
                className="hover:text-blue-900 dark:hover:text-blue-100 ml-0.5"
                title={`Remove ${choice.id}`}
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
        onClick={() => setOpen((o) => !o)}
        className={`${baseInputClass} text-left text-gray-400 dark:text-gray-500`}
      >
        {placeholder}
        <span className="float-right text-gray-400">▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 w-full mt-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg max-h-56 flex flex-col"
          style={{ top: selectedChoices.length > 0 ? 'auto' : '100%' }}
        >
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={otherProjects.length > 0 ? 'Search all projects...' : 'Search beans...'}
              className="w-full text-sm px-2 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            />
          </div>
          <BeanChoiceList choices={choices} onPick={handleAdd} loading={loading} />
        </div>
      )}
    </div>
  );
}
