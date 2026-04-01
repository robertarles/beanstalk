import React, { useState, useEffect, useCallback, memo } from 'react';
import type { Bean } from '../types/beans';
import { openBeanInEditor, openUrl } from '../lib/tauri';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { isAllowedUrl } from '../lib/markdown';
import { ParentBeanSelect } from './ParentBeanSelect';

interface BeanDetailProps {
  bean: Bean | null;
  onOpenInEditor: () => void;
  onStatusChange: (status: string) => void;
  availableStatuses: string[];
  allBeans?: Bean[];
  onSave?: (fields: Partial<Bean>) => void;
  projectPath?: string;
  /** Register an Escape handler with the keyboard nav system. Priority 20 — cancels edit mode. */
  registerEscapeHandler?: (priority: number, handler: () => boolean) => () => void;
  /** Ref callback to expose handleEditStart to the parent. */
  onEditStartRef?: React.MutableRefObject<(() => void) | null>;
}

function statusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'open':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'in-progress':
    case 'in_progress':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
    case 'completed':
    case 'done':
      return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    case 'archived':
    case 'scrapped':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
}

function typeBadgeClass(_type: string): string {
  return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
}

function formattedDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export const BeanDetail = memo(function BeanDetail({
  bean,
  onOpenInEditor,
  onStatusChange,
  availableStatuses,
  allBeans = [],
  onSave = () => {},
  projectPath = '',
  registerEscapeHandler,
  onEditStartRef,
}: BeanDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editPriority, setEditPriority] = useState<string>('');
  const [editParentId, setEditParentId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isOpeningEditor, setIsOpeningEditor] = useState(false);

  // Reset edit state whenever the bean changes
  useEffect(() => {
    if (bean) {
      setEditTitle(bean.title || '');
      setEditStatus(bean.status || '');
      setEditTags((bean.tags || []).join(', '));
      setEditAssignee(bean.assignee || '');
      setEditPriority(bean.priority || '');
      setEditParentId(bean.parent ?? null);
    }
    setIsEditing(false);
    setIsDirty(false);
  }, [bean?.id]);

  // Track dirty state
  useEffect(() => {
    if (!bean || !isEditing) return;
    const originalTags = (bean.tags || []).join(', ');
    const dirty =
      editTitle !== (bean.title || '') ||
      editStatus !== (bean.status || '') ||
      editTags !== originalTags ||
      editAssignee !== (bean.assignee || '') ||
      editPriority !== (bean.priority || '') ||
      editParentId !== (bean.parent ?? null);
    setIsDirty(dirty);
  }, [editTitle, editStatus, editTags, editAssignee, editParentId, bean, isEditing]);

  const handleEditStart = useCallback(() => {
    if (!bean) return;
    setEditTitle(bean.title || '');
    setEditStatus(bean.status || '');
    setEditTags((bean.tags || []).join(', '));
    setEditAssignee(bean.assignee || '');
    setEditPriority(bean.priority || '');
    setEditParentId(bean.parent ?? null);
    setIsDirty(false);
    setIsEditing(true);
  }, [bean]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setIsDirty(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!bean) return;
    const tagsArray = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onSave?.({
      title: editTitle,
      status: editStatus,
      tags: tagsArray,
      assignee: editAssignee || null,
      priority: editPriority || null,
      parent: editParentId ?? undefined,
    });
    setIsEditing(false);
    setIsDirty(false);
  }, [bean, editTitle, editStatus, editTags, editAssignee, editParentId, onSave]);

  const handleOpenInEditor = useCallback(async () => {
    if (!bean) return;
    setIsOpeningEditor(true);
    try {
      await openBeanInEditor(projectPath ?? '', bean.id);
      onOpenInEditor();
    } catch (e) {
      console.error('Failed to open bean in editor:', e);
    } finally {
      setTimeout(() => setIsOpeningEditor(false), 1000);
    }
  }, [bean, projectPath, onOpenInEditor]);

  // Expose dirty check for parent — via window-level beforeunload (lightweight approach)
  // The unsaved-changes warning when switching beans is handled below via a prop pattern.
  // We expose a stable ref-based check. For the confirm() approach per spec:
  const confirmDiscard = useCallback((): boolean => {
    if (!isDirty) return true;
    return window.confirm('You have unsaved changes. Discard them?');
  }, [isDirty]);

  // Expose confirmDiscard globally so App.tsx (or other components) can call it
  // before switching beans, without requiring a prop change in App.tsx.
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__beanDetailConfirmDiscard = confirmDiscard;
  }, [confirmDiscard]);

  // Register escape handler: when editing, Escape cancels edit mode (priority 20).
  useEffect(() => {
    if (!registerEscapeHandler || !isEditing) return;
    return registerEscapeHandler(20, () => {
      handleCancel();
      return true;
    });
  }, [registerEscapeHandler, isEditing, handleCancel]);

  // Expose handleEditStart to parent via ref so `e` key can trigger it.
  useEffect(() => {
    if (onEditStartRef) {
      onEditStartRef.current = handleEditStart;
    }
    return () => {
      if (onEditStartRef) {
        onEditStartRef.current = null;
      }
    };
  }, [onEditStartRef, handleEditStart]);

  if (!bean) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <span className="text-sm">Select a bean to view details</span>
      </div>
    );
  }

  // --- EDIT MODE ---
  if (isEditing) {
    const previewTags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    return (
      <div className="flex flex-col h-full p-6 gap-4 overflow-y-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Editing Bean
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="text-xs px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Title
          </label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full text-lg font-semibold px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Bean title"
            autoFocus
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Status
          </label>
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            className="text-sm px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            {!availableStatuses.includes(editStatus) && editStatus && (
              <option value={editStatus}>{editStatus}</option>
            )}
          </select>
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Priority
          </label>
          <select
            value={editPriority}
            onChange={(e) => setEditPriority(e.target.value)}
            className="text-sm px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— none —</option>
            <option value="critical">critical</option>
            <option value="high">high</option>
            <option value="normal">normal</option>
            <option value="low">low</option>
            <option value="deferred">deferred</option>
          </select>
        </div>

        {/* Parent Bean */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Parent Bean
          </label>
          <ParentBeanSelect
            beans={allBeans}
            value={editParentId}
            onChange={setEditParentId}
            excludeId={bean?.id}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Tags <span className="normal-case font-normal">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="tag1, tag2, tag3"
          />
          {previewTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {previewTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Assignee */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Assignee
          </label>
          <input
            type="text"
            value={editAssignee}
            onChange={(e) => setEditAssignee(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="username or name"
          />
        </div>

        {/* Body note */}
        <div className="mt-2 flex items-center gap-3 p-3 rounded border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Edit body in external editor →
          </span>
          <button
            onClick={handleOpenInEditor}
            disabled={isOpeningEditor}
            className="text-xs px-2.5 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {isOpeningEditor ? 'Opening…' : 'Open in Editor'}
          </button>
        </div>

        {/* ID (read-only reference) */}
        <div className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-auto pt-2">
          {bean.id}
        </div>
      </div>
    );
  }

  const statusesForSelect = [...availableStatuses];
  if (!statusesForSelect.includes(bean.status)) {
    statusesForSelect.push(bean.status);
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug flex-1">
          {bean.title || '(untitled)'}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleEditStart}
            className="text-xs px-2.5 py-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleOpenInEditor}
            disabled={isOpeningEditor}
            className="text-xs px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
          >
            {isOpeningEditor ? 'Opening…' : 'Open in Editor'}
          </button>
        </div>
      </div>

      {/* Metadata row: ID + type badge + created date */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{bean.id}</span>
        {bean.bean_type && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${typeBadgeClass(bean.bean_type)}`}
          >
            {bean.bean_type}
          </span>
        )}
        {bean.created_at && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formattedDate(bean.created_at)}
          </span>
        )}
      </div>

      {/* Status badge as inline select */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 shrink-0">
          Status
        </span>
        <div className="relative inline-flex items-center">
          <select
            value={bean.status}
            onChange={(e) => onStatusChange(e.target.value)}
            className={`appearance-none text-xs font-semibold px-2.5 py-1 pr-6 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${statusBadgeClass(bean.status)}`}
            style={{ WebkitAppearance: 'none' }}
          >
            {statusesForSelect.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {/* Chevron */}
          <svg
            className="pointer-events-none absolute right-1.5 w-3 h-3 opacity-60"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Priority */}
      {bean.priority && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 shrink-0">
            Priority
          </span>
          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{bean.priority}</span>
        </div>
      )}

      {/* Assignee */}
      {bean.assignee && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 shrink-0">
            Assignee
          </span>
          <span className="text-sm text-gray-700 dark:text-gray-300">👤 {bean.assignee}</span>
        </div>
      )}

      {/* Tags */}
      {bean.tags && bean.tags.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 shrink-0 pt-0.5">
            Tags
          </span>
          <div className="flex flex-wrap gap-1">
            {bean.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Updated */}
      {bean.updated_at && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 shrink-0">
            Updated
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formattedDate(bean.updated_at)}
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* Body */}
      <div className="flex-1">
        {bean.body ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({href, children}) => (
                  href && isAllowedUrl(href) ? (
                    <span
                      className="text-blue-500 underline cursor-pointer hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:text-blue-700 transition-colors"
                      onClick={() => openUrl(href).catch(console.error)}
                    >
                      {children}
                    </span>
                  ) : (
                    <span>{children}</span>
                  )
                ),
                code: ({className, children}) => (
                  <code className={`${className || ''} px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-gray-800 dark:text-gray-200`}>
                    {children}
                  </code>
                ),
                pre: ({children}) => (
                  <pre className="p-3 rounded bg-gray-900 dark:bg-gray-950 overflow-x-auto [&>code]:bg-transparent">
                    {children}
                  </pre>
                ),
                input: (props) => <input {...props} readOnly />,
                table: ({children}) => (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
                      {children}
                    </table>
                  </div>
                ),
                th: ({children}) => (
                  <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-left text-sm font-semibold">
                    {children}
                  </th>
                ),
                td: ({children}) => (
                  <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm">
                    {children}
                  </td>
                ),
              }}
            >
              {bean.body}
            </ReactMarkdown>
          </div>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-600 italic">No description</span>
        )}
      </div>
    </div>
  );
});
