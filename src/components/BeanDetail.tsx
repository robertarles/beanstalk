import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import type { Bean } from '../types/beans';
import { openBeanInEditor, openUrl } from '../lib/tauri';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { isAllowedUrl } from '../lib/markdown';
import { remarkWikilink } from '../lib/remarkWikilink';
import { buildBeanIndex, resolveWikilink, wikilinkTitle } from '../lib/resolveWikilink';
import { EMPTY_PREFIX_MAP, type PrefixMap } from '../lib/prefixMap';
import { changedFields, type BeanEditState } from '../lib/beanChanges';
import { asBeansError, isConflict } from '../lib/beansError';
import { useForeignBeanPreview } from '../hooks/useForeignBeanPreview';
import { BodyEditor } from './BodyEditor';
import { ParentBeanSelect } from './ParentBeanSelect';
import { RelatedBeansSelect } from './RelatedBeansSelect';

interface BeanDetailProps {
  bean: Bean | null;
  onOpenInEditor: () => void;
  onStatusChange: (status: string) => void;
  onPriorityChange?: (priority: string | null) => void | Promise<void>;
  availableStatuses: string[];
  allBeans?: Bean[];
  onSave?: (fields: Partial<Bean> & { expectBody?: string }) => void | Promise<void>;
  onTouch?: () => void | Promise<void>;
  /** Surface a user-visible error (e.g. failing to launch the external editor). */
  onError?: (message: string) => void;
  projectPath?: string;
  /**
   * Select another bean. `projectPath` selects a bean in a different project,
   * switching the active project first; omitted means the current project.
   */
  onSelectBean?: (id: string, projectPath?: string) => void;
  /** Prefix → project routing, so `[[...]]` can resolve across projects. */
  prefixMap?: PrefixMap;
  /**
   * Whether the `beans` binary is available. Beanstalk writes only through it
   * (beanstalk-dg1m), so editing, Touch and the status dropdown are gated on
   * this. The external editor button deliberately is not.
   */
  beansAvailable?: boolean;
  /** Why writes are unavailable, shown on the disabled controls. */
  beansError?: string | null;
  /** Register an Escape handler with the keyboard nav system. Priority 20 — cancels edit mode. */
  registerEscapeHandler?: (priority: number, handler: () => boolean) => () => void;
  /** Ref callback to expose handleEditStart to the parent. */
  onEditStartRef?: React.MutableRefObject<(() => void) | null>;
}

const BEAN_STATUSES = ['todo', 'in-progress', 'completed', 'scrapped', 'draft'];

/** Asked before throwing away edits. The body makes this worth having: it is the
 * one field where a discarded draft is real work lost. */
const DISCARD_PROMPT = 'You have unsaved changes. Discard them?';

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
    case 'draft':
      return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
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

/**
 * A Blocking / Blocked By id in the detail pane.
 *
 * Clickable when the pane has a way to select another bean, inert otherwise —
 * so a `BeanDetail` rendered without `onSelectBean` keeps its old appearance
 * rather than offering a button that does nothing.
 */
function RelationBadge({
  id,
  onSelectBean,
  className,
}: {
  id: string;
  onSelectBean?: (id: string, projectPath?: string) => void;
  className: string;
}) {
  const base = `text-xs px-1.5 py-0.5 rounded font-mono ${className}`;
  if (!onSelectBean) return <span className={base}>{id}</span>;
  return (
    <button
      type="button"
      onClick={() => onSelectBean(id)}
      title={`Go to ${id}`}
      className={`${base} cursor-pointer hover:brightness-95 dark:hover:brightness-125 focus:outline-none focus:ring-2 focus:ring-blue-500`}
    >
      {id}
    </button>
  );
}

/**
 * A `[[...]]` reference in a bean body.
 *
 * Local and foreign differ by colour and a small marker, not by shape — they are
 * the same kind of thing pointing at different places. `missing` is the one that
 * looks plainly non-interactive.
 *
 * Never routed through `openUrl`: that opens the system browser, and these
 * navigate in-app.
 */
function WikilinkView({
  target,
  display,
  resolved,
  onSelectBean,
}: {
  target: string;
  display?: string;
  resolved: ReturnType<typeof resolveWikilink>;
  onSelectBean?: (id: string, projectPath?: string) => void;
}) {
  const label = display ?? target;

  // Hover or keyboard focus is what asks for the foreign bean's title. Without
  // this gate a body citing forty foreign beans would fire forty calls on render.
  const [probed, setProbed] = useState(false);
  const preview = useForeignBeanPreview(
    resolved.kind === 'foreign' ? resolved.projectPath : null,
    resolved.kind === 'foreign' ? resolved.id : null,
    probed
  );

  // A foreign bean confirmed absent is dead, and should look it before it is
  // clicked rather than after a project switch that finds nothing. An *unreadable*
  // project is not the same claim, so that degrades to a plain cross-project link.
  const confirmedGone = resolved.kind === 'foreign' && preview.status === 'missing';

  let title = wikilinkTitle(confirmedGone ? { kind: 'missing' } : resolved);
  if (resolved.kind === 'foreign' && preview.status === 'found') {
    title = `${title} — ${preview.title}`;
  }

  if (resolved.kind === 'missing' || confirmedGone || !onSelectBean) {
    return (
      <span
        title={title}
        className="text-gray-400 dark:text-gray-500 underline decoration-dotted decoration-gray-300 dark:decoration-gray-600 cursor-help"
      >
        {label}
      </span>
    );
  }

  const isForeign = resolved.kind === 'foreign';
  const colour = isForeign
    ? 'text-violet-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 active:text-violet-700'
    : 'text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:text-blue-700';

  return (
    <button
      type="button"
      title={title}
      onMouseEnter={() => setProbed(true)}
      onFocus={() => setProbed(true)}
      onClick={() =>
        resolved.kind === 'foreign'
          ? onSelectBean(resolved.id, resolved.projectPath)
          : onSelectBean(resolved.bean.id)
      }
      className={`${colour} underline cursor-pointer transition-colors rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
    >
      {label}
      {isForeign && (
        <span className="ml-0.5 text-[0.7em] align-super" aria-hidden="true">
          ↗
        </span>
      )}
    </button>
  );
}

const BEAN_PRIORITIES = ['critical', 'high', 'normal', 'low', 'deferred'] as const;

export const BeanDetail = memo(function BeanDetail({
  bean,
  onOpenInEditor,
  onStatusChange,
  onPriorityChange,
  availableStatuses,
  allBeans = [],
  onSave = () => {},
  onTouch,
  onError,
  projectPath = '',
  onSelectBean,
  prefixMap = EMPTY_PREFIX_MAP,
  beansAvailable = true,
  beansError,
  registerEscapeHandler,
  onEditStartRef,
}: BeanDetailProps) {
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Resolution context for `[[...]]` links in the body.
   *
   * The id index is built once per bean-set change, not once per link: a body
   * citing forty beans must not walk the tree forty times.
   */
  /**
   * Configured projects other than this one, for the cross-project pickers.
   *
   * Taken from the prefix map, which App already loads for wikilink routing, so
   * this needs no extra prop or backend call.
   */
  const otherProjects = useMemo(
    () => prefixMap.entries.filter((p) => p.path !== projectPath),
    [prefixMap, projectPath]
  );

  const writesDisabledTitle =
    beansError ??
    'Editing needs the `beans` CLI, which Beanstalk writes bean files through. The external editor still works.';

  const wikilinkContext = useMemo(
    () => ({
      index: buildBeanIndex(allBeans),
      prefixMap,
      activeProjectPath: projectPath === '' ? null : projectPath,
    }),
    [allBeans, prefixMap, projectPath]
  );
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editPriority, setEditPriority] = useState<string>('');
  const [editParentId, setEditParentId] = useState<string | null>(null);
  const [editBlocking, setEditBlocking] = useState<string[]>([]);
  const [editBlockedBy, setEditBlockedBy] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpeningEditor, setIsOpeningEditor] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  /**
   * The body as it was when edit mode opened.
   *
   * Sent with a body change so the backend can refuse the write if the file
   * moved underneath (beanstalk-ep8j). Every other field is omitted when
   * unchanged and so is taken from disk anyway; the body is the one field being
   * replaced, so it has nothing to preserve it.
   */
  const [baseBody, setBaseBody] = useState('');
  const [editBody, setEditBody] = useState('');
  const [conflict, setConflict] = useState<string | null>(null);

  // Reset edit state whenever the bean changes
  useEffect(() => {
    if (bean) {
      setEditTitle(bean.title || '');
      setEditStatus(bean.status || '');
      setEditTags((bean.tags || []).join(', '));
      setEditPriority(bean.priority || '');
      setEditParentId(bean.parent ?? null);
      setEditBlocking(bean.blocking || []);
      setEditBlockedBy(bean.blocked_by || []);
    }
    setBaseBody(bean?.body ?? '');
    setEditBody(bean?.body ?? '');
    setIsEditing(false);
    setIsDirty(false);
    setConflict(null);
  }, [bean?.id]);

  /** The form's values, normalised for comparison and for the save payload. */
  const editState = useMemo<BeanEditState>(
    () => ({
      title: editTitle,
      status: editStatus,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
      priority: editPriority,
      parentId: editParentId,
      blocking: editBlocking,
      blockedBy: editBlockedBy,
      body: editBody,
    }),
    [editTitle, editStatus, editTags, editPriority, editParentId, editBlocking, editBlockedBy, editBody]
  );

  /**
   * Exactly what will be written. The dirty flag and the save payload derive
   * from one comparison, so they cannot disagree -- the previous effect had its
   * own inline comparison whose dependency list omitted `editPriority`, so a
   * priority-only change never marked the form dirty.
   */
  const changes = useMemo(
    () => (bean ? changedFields(bean, editState) : {}),
    [bean, editState]
  );

  useEffect(() => {
    setIsDirty(isEditing && Object.keys(changes).length > 0);
  }, [changes, isEditing]);

  const handleEditStart = useCallback(() => {
    if (!bean) return;
    setEditTitle(bean.title || '');
    setEditStatus(bean.status || '');
    setEditTags((bean.tags || []).join(', '));
    setEditPriority(bean.priority || '');
    setEditParentId(bean.parent ?? null);
    setEditBlocking(bean.blocking || []);
    setEditBlockedBy(bean.blocked_by || []);
    setBaseBody(bean.body ?? '');
    setEditBody(bean.body ?? '');
    setIsDirty(false);
    setConflict(null);
    setIsEditing(true);
  }, [bean]);

  const handleCancel = useCallback(() => {
    // Now that the body is editable inline, cancelling can discard real work, so
    // confirm rather than dropping it silently. Escape routes here too.
    if (isDirty && !window.confirm(DISCARD_PROMPT)) return;
    setIsEditing(false);
    setIsDirty(false);
    setConflict(null);
  }, [isDirty]);

  const handleSave = useCallback(async () => {
    if (!bean) return;
    // Nothing changed: close without writing. Touch is the deliberate way to
    // bump `updated_at`, so a Save that silently did it would be surprising.
    if (Object.keys(changes).length === 0) {
      setIsEditing(false);
      setIsDirty(false);
      return;
    }
    setIsSaving(true);
    setConflict(null);
    try {
      // The base is only relevant when the body is actually being rewritten.
      await onSave?.(
        changes.body !== undefined ? { ...changes, expectBody: baseBody } : changes
      );
      setIsEditing(false);
      setIsDirty(false);
    } catch (err) {
      // Stay in edit mode either way: the typed text is the one thing that must
      // never be lost. A conflict gets its own explanation; anything else has
      // already been surfaced as a toast by the caller.
      if (isConflict(err)) setConflict(asBeansError(err).message);
    } finally {
      setIsSaving(false);
    }
  }, [bean, changes, baseBody, onSave]);

  const handleOpenInEditor = useCallback(async () => {
    if (!bean) return;
    setIsOpeningEditor(true);
    try {
      await openBeanInEditor(projectPath ?? '', bean.id);
      onOpenInEditor();
    } catch (e) {
      console.error('Failed to open bean in editor:', e);
      onError?.(e instanceof Error ? e.message : 'Failed to open bean in editor');
    } finally {
      setTimeout(() => setIsOpeningEditor(false), 1000);
    }
  }, [bean, projectPath, onOpenInEditor, onError]);

  const handleTouch = useCallback(async () => {
    if (!bean || !onTouch) return;
    setIsTouching(true);
    try {
      await onTouch();
    } finally {
      setIsTouching(false);
    }
  }, [bean, onTouch]);

  // Expose dirty check for parent — via window-level beforeunload (lightweight approach)
  // The unsaved-changes warning when switching beans is handled below via a prop pattern.
  // We expose a stable ref-based check. For the confirm() approach per spec:
  const confirmDiscard = useCallback((): boolean => {
    if (!isDirty) return true;
    return window.confirm(DISCARD_PROMPT);
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
      <div className="relative flex flex-col h-full p-6 gap-4 overflow-y-auto">
        {/* Saving overlay */}
        {isSaving && (
          <div className="absolute inset-0 z-10 bg-white/75 dark:bg-gray-950/75 flex items-center justify-center rounded">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Saving…</span>
          </div>
        )}
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Editing Bean
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="text-xs px-3 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save'}
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
            {BEAN_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            {!BEAN_STATUSES.includes(editStatus) && editStatus && (
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

        {conflict && (
          <div
            role="alert"
            className="text-sm px-3 py-2 rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
          >
            {conflict}
          </div>
        )}
        {!conflict && isEditing && bean && (bean.body ?? '') !== baseBody && (
          <div
            role="status"
            className="text-sm px-3 py-2 rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
          >
            This bean changed on disk while you were editing. Your text is still
            here; saving a body change will be refused so nothing is overwritten.
          </div>
        )}

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

        {/* Blocking */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Blocking
          </label>
          <RelatedBeansSelect
            beans={allBeans}
            value={editBlocking}
            onChange={setEditBlocking}
            excludeId={bean?.id}
            placeholder="Add bean this blocks..."
            otherProjects={otherProjects}
          />
        </div>

        {/* Blocked By */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Blocked By
          </label>
          <RelatedBeansSelect
            beans={allBeans}
            value={editBlockedBy}
            onChange={setEditBlockedBy}
            excludeId={bean?.id}
            placeholder="Add bean that blocks this..."
            otherProjects={otherProjects}
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

        {/*
          No Assignee input: `beans` has no assignee field, and Beanstalk writes
          only through it (beanstalk-dg1m), so an input here could not persist.
          The value is no longer read or shown either: reads go through `beans`,
          which does not report it. See beanstalk-mlm7.
        */}

        {/* Body */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Body
            </label>
            {/*
              Kept alongside the inline editor, not replaced by it. The external
              editor remains the right tool for long-form work, is never gated on
              the `beans` binary, and can write frontmatter beans cannot express.
            */}
            <button
              onClick={handleOpenInEditor}
              disabled={isOpeningEditor}
              title="Open this bean in your external editor"
              className="text-xs px-2.5 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isOpeningEditor ? 'Opening…' : <>Editor <span className="text-[10px]">↗</span></>}
            </button>
          </div>
          <BodyEditor
            value={editBody}
            onChange={setEditBody}
            beans={allBeans}
            otherProjects={otherProjects}
            placeholder="Markdown body… type [[ to link a bean"
            rows={16}
            className="w-full text-sm px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-y"
          />
        </div>

        {/* ID (read-only reference) */}
        <div className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-auto pt-2">
          {bean.id}
        </div>
      </div>
    );
  }

  // Always offer the canonical statuses (so terminal statuses like
  // 'completed'/'scrapped' remain selectable even when no loaded bean currently
  // has them — archived beans are excluded from `availableStatuses`), then union
  // in any custom project statuses and the current bean's status.
  const statusesForSelect = [...BEAN_STATUSES];
  for (const s of [...availableStatuses, bean.status]) {
    if (!statusesForSelect.includes(s)) {
      statusesForSelect.push(s);
    }
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4 overflow-y-auto">
      {/* Toolbar — above title */}
      <div className="flex items-center gap-2">
        {onTouch && (
          <button
            onClick={handleTouch}
            disabled={isTouching || !beansAvailable}
            title={beansAvailable ? 'Update updated_at to now' : writesDisabledTitle}
            className="text-xs px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800 text-blue-400 dark:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors disabled:opacity-50"
          >
            {isTouching ? 'Touching…' : 'Touch'}
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={handleEditStart}
          disabled={!beansAvailable}
          title={beansAvailable ? undefined : writesDisabledTitle}
          className="text-xs px-2.5 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Edit
        </button>
        {/*
          Never gated on `beans`: this launches an editor rather than writing
          anything, so it is the escape hatch that keeps the pane usable when the
          binary is missing. See beanstalk-mlm7.
        */}
        <button
          onClick={handleOpenInEditor}
          disabled={isOpeningEditor}
          className="text-xs px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
        >
          {isOpeningEditor ? 'Opening…' : <>Edit <span className="text-[10px]">↗</span></>}
        </button>
      </div>

      {/* Title */}
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
        {bean.title || '(untitled)'}
      </h1>

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
            aria-label="Status"
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
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 shrink-0">
          Priority
        </span>
        <select
          value={bean.priority ?? ''}
          onChange={(e) => onPriorityChange?.(e.target.value || null)}
          className="text-xs px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">— none —</option>
          {BEAN_PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

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

      {/* Blocking */}
      {bean.blocking && bean.blocking.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 shrink-0 pt-0.5">
            Blocking
          </span>
          <div className="flex flex-wrap gap-1">
            {bean.blocking.map((id) => (
              <RelationBadge
                key={id}
                id={id}
                onSelectBean={onSelectBean}
                className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300"
              />
            ))}
          </div>
        </div>
      )}

      {/* Blocked By */}
      {bean.blocked_by && bean.blocked_by.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20 shrink-0 pt-0.5">
            Blocked By
          </span>
          <div className="flex flex-wrap gap-1">
            {bean.blocked_by.map((id) => (
              <RelationBadge
                key={id}
                id={id}
                onSelectBean={onSelectBean}
                className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
              />
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
              remarkPlugins={[remarkGfm, remarkWikilink]}
              components={{
                // @ts-expect-error `wikilink` is the custom element remarkWikilink emits.
                wikilink: ({target, display}: {target?: string; display?: string}) => (
                  target ? (
                    <WikilinkView
                      target={target}
                      display={display}
                      resolved={resolveWikilink(target, wikilinkContext)}
                      onSelectBean={onSelectBean}
                    />
                  ) : null
                ),
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
