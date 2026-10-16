import type { Bean } from '../types/beans';

/** The edit form's current values, normalised out of its input widgets. */
export interface BeanEditState {
  title: string;
  status: string;
  /** Already split and trimmed from the comma-separated field. */
  tags: string[];
  /** `''` means no priority. */
  priority: string;
  parentId: string | null;
  blocking: string[];
  blockedBy: string[];
  /** Only present once the body is editable inline; omitted means untouched. */
  body?: string;
}

/** Order-insensitive list comparison: reordering tags is not a change. */
function sameList(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const x = [...a].sort();
  const y = [...b].sort();
  return x.every((v, i) => v === y[i]);
}

/**
 * The subset of fields the user actually changed.
 *
 * Only these are sent on save. Restating unchanged fields means writing values
 * from a copy of the bean that may be minutes old, which is how a status change
 * came to blank a title (`beanstalk-e5ce`, and the `8a29bd1` fix). Omitting a
 * field leaves whatever is on disk alone, because `update_bean` treats an absent
 * field as "keep".
 *
 * An empty result means nothing changed, and the caller should not write at all.
 */
export function changedFields(bean: Bean, edit: BeanEditState): Partial<Bean> {
  const changes: Partial<Bean> = {};

  if (edit.title !== (bean.title || '')) changes.title = edit.title;
  if (edit.status !== (bean.status || '')) changes.status = edit.status;
  if (!sameList(edit.tags, bean.tags || [])) changes.tags = edit.tags;

  // `''` in the form means "no priority", which is distinct from "unchanged".
  // Sending `null` is what the backend turns into the CLI's explicit clear, so
  // clearing and leaving alone never collapse into the same payload.
  if (edit.priority !== (bean.priority || '')) {
    changes.priority = edit.priority || null;
  }

  if (edit.parentId !== (bean.parent ?? null)) changes.parent = edit.parentId;
  if (!sameList(edit.blocking, bean.blocking || [])) changes.blocking = edit.blocking;
  if (!sameList(edit.blockedBy, bean.blocked_by || [])) changes.blocked_by = edit.blockedBy;

  if (edit.body !== undefined && edit.body !== (bean.body || '')) {
    changes.body = edit.body;
  }

  return changes;
}

/** Whether the form differs from the bean it was loaded from. */
export function isDirty(bean: Bean, edit: BeanEditState): boolean {
  return Object.keys(changedFields(bean, edit)).length > 0;
}
