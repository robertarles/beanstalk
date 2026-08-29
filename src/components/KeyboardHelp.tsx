import { useEffect } from 'react';

interface KeyboardHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Binding {
  keys: string;
  description: string;
}

interface Section {
  title: string;
  bindings: Binding[];
}

const SECTIONS: Section[] = [
  {
    title: 'Global',
    bindings: [
      { keys: 'j', description: 'Select next bean' },
      { keys: 'k', description: 'Select previous bean' },
      { keys: 'l', description: 'Expand / collapse selected bean' },
      { keys: 'Ctrl-h', description: 'Move focus to left panel' },
      { keys: 'Ctrl-l', description: 'Move focus to right panel' },
      { keys: 'g g', description: 'Jump to top of list' },
      { keys: 'G', description: 'Jump to bottom of list' },
      { keys: '/', description: 'Focus search input' },
      { keys: 'Escape', description: 'Close modal / cancel edit / deselect' },
      { keys: '?', description: 'Toggle this help overlay' },
    ],
  },
  {
    title: 'Bean Actions',
    bindings: [
      { keys: 'Enter', description: 'Open bean in detail panel' },
      { keys: 'Space', description: 'Open action menu (edit + scripts)' },
      { keys: 'e', description: 'Open selected bean in external editor' },
      { keys: 'i', description: 'Enter inline edit mode' },
      { keys: 'n / a', description: 'Open new bean form' },
      { keys: 's', description: 'Cycle status forward' },
      { keys: 'y', description: 'Copy bean ID to clipboard' },
    ],
  },
  {
    title: 'Action Menu',
    bindings: [
      { keys: 'Space', description: 'Open menu for the selected bean' },
      { keys: 'Right-click', description: 'Open menu for a row' },
      { keys: 'j / k', description: 'Move down / up in the menu' },
      { keys: 'Enter', description: 'Run the highlighted action' },
      { keys: 'Escape', description: 'Close the menu' },
    ],
  },
  {
    title: 'Detail Panel',
    bindings: [
      { keys: 'Ctrl-f', description: 'Scroll body down half a page' },
      { keys: 'Ctrl-b', description: 'Scroll body up half a page' },
    ],
  },
];

export function KeyboardHelp({ isOpen, onClose }: KeyboardHelpProps) {
  // Close on Escape via a native listener so this runs before the tinykeys
  // handler (capture phase, highest priority).
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors leading-none text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-5">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                {section.title}
              </h3>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {section.bindings.map((binding) => (
                    <tr
                      key={binding.keys}
                      className="border-t border-gray-100 dark:border-gray-800 first:border-0"
                    >
                      <td className="py-1.5 pr-4 w-28 align-top">
                        <kbd className="inline-block px-1.5 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 whitespace-nowrap">
                          {binding.keys}
                        </kbd>
                      </td>
                      <td className="py-1.5 text-gray-700 dark:text-gray-300 align-top">
                        {binding.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <p className="mt-5 text-xs text-gray-400 dark:text-gray-500 text-center">
          Press <kbd className="px-1 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">?</kbd> or <kbd className="px-1 py-0.5 rounded text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
