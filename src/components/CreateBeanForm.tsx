import { useState, useEffect, useCallback, useRef } from 'react';
import type { Bean } from '../types/beans';
import { createBean } from '../lib/tauri';
import { ParentBeanSelect } from './ParentBeanSelect';

interface CreateBeanFormProps {
  projectPath: string;
  availableStatuses: string[];
  allBeans: Bean[];
  onCreated: (bean: Bean) => void;
  onCancel: () => void;
  /** Register an Escape handler with the keyboard nav system. Priority 20. */
  registerEscapeHandler?: (priority: number, handler: () => boolean) => () => void;
}

const BEAN_TYPES = ['task', 'epic', 'milestone'];

export function CreateBeanForm({
  projectPath,
  availableStatuses,
  allBeans,
  onCreated,
  onCancel,
  registerEscapeHandler,
}: CreateBeanFormProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState(availableStatuses.includes('open') ? 'open' : (availableStatuses[0] ?? ''));
  const [beanType, setBeanType] = useState('task');
  const [parentId, setParentId] = useState<string | null>(null);
  const [tags, setTags] = useState('');
  const [assignee, setAssignee] = useState('');
  const [body, setBody] = useState('');
  const [titleError, setTitleError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  // Auto-focus the title field on mount
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Escape key cancels the form — register with the escape chain (priority 20) when available,
  // otherwise fall back to a raw listener for standalone use (e.g. tests).
  useEffect(() => {
    if (registerEscapeHandler) {
      return registerEscapeHandler(20, () => {
        onCancel();
        return true;
      });
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, registerEscapeHandler]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validation
      if (!title.trim()) {
        setTitleError('Title is required');
        titleRef.current?.focus();
        return;
      }
      setTitleError('');

      setIsSubmitting(true);
      setSubmitError('');

      try {
        const tagsArray = tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);

        const bean = await createBean({
          projectPath,
          title: title.trim(),
          status,
          beanType,
          parent: parentId ?? undefined,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          assignee: assignee.trim() || null,
          body: body.trim() || undefined,
        });

        onCreated(bean);
      } catch (err) {
        setSubmitError(typeof err === 'string' ? err : 'Failed to create bean. Please try again.');
        setIsSubmitting(false);
      }
    },
    [projectPath, title, beanType, tags, assignee, body, onCreated]
  );

  const inputClass =
    'w-full text-sm px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500';

  const labelClass =
    'text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider';

  return (
    <div className="flex flex-col h-full p-6 gap-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          New Bean
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Creating...' : 'Create Bean'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            Title <span className="text-red-500 normal-case font-normal">*</span>
          </label>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (e.target.value.trim()) setTitleError('');
            }}
            placeholder="Bean title"
            className={[
              inputClass,
              'text-base font-medium',
              titleError ? 'border-red-400 focus:ring-red-400' : '',
            ].join(' ')}
            autoFocus
          />
          {titleError && (
            <span className="text-xs text-red-500 mt-0.5">{titleError}</span>
          )}
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            {availableStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Type</label>
          <select
            value={beanType}
            onChange={(e) => setBeanType(e.target.value)}
            className={inputClass}
          >
            {BEAN_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Parent */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Parent Bean</label>
          <ParentBeanSelect
            beans={allBeans}
            value={parentId}
            onChange={setParentId}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>
            Tags <span className="normal-case font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tag1, tag2, tag3"
            className={inputClass}
          />
        </div>

        {/* Assignee */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Assignee</label>
          <input
            type="text"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="username or name"
            className={inputClass}
          />
        </div>

        {/* Body */}
        <div className="flex flex-col gap-1">
          <label className={labelClass}>Description</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Optional description..."
            rows={5}
            className={[inputClass, 'resize-y'].join(' ')}
          />
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="text-sm text-red-500 px-3 py-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            {submitError}
          </div>
        )}
      </form>
    </div>
  );
}
