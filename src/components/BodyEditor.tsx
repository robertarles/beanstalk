import { useCallback, useRef, useState } from 'react';
import type { Bean, ProjectPrefix } from '../types/beans';
import { useBeanChoices } from '../hooks/useBeanChoices';
import { BeanChoiceList } from './BeanChoiceList';
import { findWikilinkQuery, insertWikilink } from '../lib/wikilinkAutocomplete';

interface BodyEditorProps {
  value: string;
  onChange: (value: string) => void;
  beans: Bean[];
  otherProjects?: ProjectPrefix[];
  placeholder?: string;
  rows?: number;
  className?: string;
}

/**
 * A bean-body textarea that offers a bean picker when `[[` is typed.
 *
 * Ids are what the syntax accepts, and ids are not memorable — this is what makes
 * them tolerable to type. The picker is cross-project, and an inserted id needs no
 * project qualification because prefixes already make it unambiguous.
 */
export function BodyEditor({
  value,
  onChange,
  beans,
  otherProjects = [],
  placeholder,
  rows = 5,
  className,
}: BodyEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // The open `[[` run, or null when the caret is not inside one.
  const [query, setQuery] = useState<ReturnType<typeof findWikilinkQuery>>(null);
  const [caret, setCaret] = useState(0);
  const [highlighted, setHighlighted] = useState(0);
  // Escape leaves the literal `[[` alone; this keeps it dismissed until the caret
  // moves out of that run, so the picker does not immediately reopen.
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  const { choices, loading } = useBeanChoices({
    beans,
    otherProjects,
    query: query?.query ?? '',
    active: query !== null,
  });

  const sync = useCallback(
    (text: string, position: number) => {
      const found = findWikilinkQuery(text, position);
      setCaret(position);
      setQuery(found);
      setHighlighted(0);
      if (found === null || found.start !== dismissedAt) {
        if (found === null) setDismissedAt(null);
      }
    },
    [dismissedAt]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      sync(e.target.value, e.target.selectionStart ?? e.target.value.length);
    },
    [onChange, sync]
  );

  const pick = useCallback(
    (id: string) => {
      if (!query) return;
      const next = insertWikilink(value, query, caret, id);
      onChange(next.value);
      setQuery(null);
      setDismissedAt(null);
      // Restore focus and put the caret after the inserted link.
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(next.caret, next.caret);
      });
    },
    [query, value, caret, onChange]
  );

  const open = query !== null && query.start !== dismissedAt;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!open || choices.length === 0) {
        // With the picker closed, Escape belongs to whatever wraps this editor.
        if (e.key === 'Escape' && query !== null) {
          setDismissedAt(query.start);
          e.stopPropagation();
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlighted((h) => (h + 1) % choices.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted((h) => (h - 1 + choices.length) % choices.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        pick(choices[highlighted].id);
      } else if (e.key === 'Escape') {
        // Leave the literal text as typed; only close the picker.
        e.preventDefault();
        e.stopPropagation();
        setDismissedAt(query.start);
      }
    },
    [open, choices, highlighted, pick, query]
  );

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={(e) => sync(value, e.currentTarget.selectionStart ?? 0)}
        onBlur={() => setQuery(null)}
        placeholder={placeholder}
        rows={rows}
        className={className}
      />
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg max-h-56 flex flex-col">
          <BeanChoiceList
            choices={choices}
            onPick={pick}
            highlighted={highlighted}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
