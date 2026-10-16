import type { BeanChoice } from '../hooks/useBeanChoices';

interface BeanChoiceListProps {
  choices: BeanChoice[];
  onPick: (id: string) => void;
  /** Index of the keyboard-highlighted row, or -1 for none. */
  highlighted?: number;
  /** Still fetching other projects' beans. */
  loading?: boolean;
}

/**
 * The results list shared by the relation pickers and the `[[` autocomplete.
 *
 * A foreign bean's project is always shown: `beanstalk-4ad6` and `hivelens-4ad6`
 * are hard to tell apart at a glance, and their titles may be identical.
 */
export function BeanChoiceList({
  choices,
  onPick,
  highlighted = -1,
  loading = false,
}: BeanChoiceListProps) {
  return (
    <ul className="overflow-y-auto flex-1" role="listbox">
      {choices.length === 0 && (
        <li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">
          {loading ? 'Searching other projects…' : 'No results'}
        </li>
      )}
      {choices.map((choice, i) => (
        <li key={`${choice.projectName ?? ''}:${choice.id}`}>
          <button
            type="button"
            role="option"
            aria-selected={i === highlighted}
            // Keep focus in the text field: the caret must not move when picking.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(choice.id)}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200 ${
              i === highlighted
                ? 'bg-blue-50 dark:bg-blue-900/30'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <span className="truncate flex-1">{choice.title}</span>
            {choice.projectName && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 shrink-0">
                {choice.projectName}
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-600 font-mono shrink-0">
              {choice.id}
            </span>
          </button>
        </li>
      ))}
      {loading && choices.length > 0 && (
        <li className="px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500">
          Searching other projects…
        </li>
      )}
    </ul>
  );
}
