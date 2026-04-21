import { useState, useRef, useEffect } from 'react';

interface AddProjectDialogProps {
  onAdd: (path: string) => Promise<void>;
  onClose: () => void;
  recentProjects?: string[];
}

export function AddProjectDialog({ onAdd, onClose, recentProjects = [] }: AddProjectDialogProps) {
  const [path, setPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const submit = async (trimmed: string) => {
    setError(null);
    setSubmitting(true);
    try {
      await onAdd(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = path.trim();
    if (!trimmed) {
      setError('Path must not be empty.');
      return;
    }
    await submit(trimmed);
  };

  const handleRecentSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (!selected) return;
    await submit(selected);
  };

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Add Project
        </h2>

        {recentProjects.length > 0 && (
          <div className="mb-4">
            <label
              htmlFor="recent-projects"
              className="block text-sm text-gray-700 dark:text-gray-300 mb-1"
            >
              Recent projects
            </label>
            <select
              id="recent-projects"
              defaultValue=""
              onChange={handleRecentSelect}
              disabled={submitting}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="" disabled>— select a recent project —</option>
              {recentProjects.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label
            htmlFor="project-path"
            className="block text-sm text-gray-700 dark:text-gray-300 mb-1"
          >
            Project directory path
          </label>
          <input
            ref={inputRef}
            id="project-path"
            type="text"
            value={path}
            onChange={(e) => {
              setPath(e.target.value);
              if (error) setError(null);
            }}
            placeholder="/path/to/project"
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={submitting}
          />

          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
