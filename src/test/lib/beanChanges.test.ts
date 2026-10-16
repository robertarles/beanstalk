import { describe, it, expect } from 'vitest'
import { changedFields, isDirty, type BeanEditState } from '../../lib/beanChanges'
import type { Bean } from '../../types/beans'

const bean: Bean = {
  id: 'beanstalk-abcd',
  title: 'Original Title',
  status: 'todo',
  bean_type: 'task',
  parent: 'beanstalk-parent',
  tags: ['alpha', 'beta'],
  priority: 'high',
  assignee: 'robert',
  created_at: null,
  updated_at: null,
  body: 'Original body.',
  file_path: '/p/.beans/beanstalk-abcd.md',
  children: [],
  blocking: ['beanstalk-blk'],
  blocked_by: [],
}

/** The form as loaded from `bean`, i.e. nothing touched. */
const pristine: BeanEditState = {
  title: 'Original Title',
  status: 'todo',
  tags: ['alpha', 'beta'],
  priority: 'high',
  parentId: 'beanstalk-parent',
  blocking: ['beanstalk-blk'],
  blockedBy: [],
}

describe('changedFields (beanstalk-c57u)', () => {
  it('returns nothing when the form is untouched', () => {
    expect(changedFields(bean, pristine)).toEqual({})
    expect(isDirty(bean, pristine)).toBe(false)
  })

  it('returns only the field that changed', () => {
    expect(changedFields(bean, { ...pristine, title: 'New' })).toEqual({ title: 'New' })
    expect(changedFields(bean, { ...pristine, status: 'completed' })).toEqual({ status: 'completed' })
  })

  it('detects a priority-only change', () => {
    // The previous inline comparison omitted editPriority from its dependency
    // list, so a priority-only edit never marked the form dirty.
    expect(changedFields(bean, { ...pristine, priority: 'low' })).toEqual({ priority: 'low' })
    expect(isDirty(bean, { ...pristine, priority: 'low' })).toBe(true)
  })

  it('distinguishes clearing a priority from leaving it alone', () => {
    // '' in the form means "no priority" and must reach the backend as null,
    // which it turns into the CLI's explicit clear.
    expect(changedFields(bean, { ...pristine, priority: '' })).toEqual({ priority: null })
    // Whereas an unchanged priority is absent entirely.
    expect(changedFields(bean, pristine)).not.toHaveProperty('priority')
  })

  it('treats a bean with no priority as equivalent to an empty field', () => {
    const none = { ...bean, priority: null }
    expect(changedFields(none, { ...pristine, priority: '' })).toEqual({})
  })

  it('distinguishes clearing a parent from leaving it alone', () => {
    expect(changedFields(bean, { ...pristine, parentId: null })).toEqual({ parent: null })
    expect(changedFields(bean, pristine)).not.toHaveProperty('parent')
  })

  it('detects added and removed tags', () => {
    expect(changedFields(bean, { ...pristine, tags: ['alpha'] })).toEqual({ tags: ['alpha'] })
    expect(changedFields(bean, { ...pristine, tags: ['alpha', 'beta', 'gamma'] })).toEqual({
      tags: ['alpha', 'beta', 'gamma'],
    })
  })

  it('ignores a pure tag reordering', () => {
    // Reordering is not a change the backend can even express: it sets tags by
    // add/remove, so a reorder would produce an empty diff anyway.
    expect(changedFields(bean, { ...pristine, tags: ['beta', 'alpha'] })).toEqual({})
  })

  it('detects relation changes and ignores their order', () => {
    expect(changedFields(bean, { ...pristine, blockedBy: ['beanstalk-dep'] })).toEqual({
      blocked_by: ['beanstalk-dep'],
    })
    const two = { ...bean, blocking: ['a', 'b'] }
    expect(changedFields(two, { ...pristine, blocking: ['b', 'a'] })).toEqual({})
  })

  it('omits the body entirely when the form does not edit it', () => {
    // Until the body is editable inline, it must never appear in a payload --
    // that omission is what currently protects it from a stale copy.
    expect(changedFields(bean, pristine)).not.toHaveProperty('body')
  })

  it('includes the body once it is edited', () => {
    expect(changedFields(bean, { ...pristine, body: 'Rewritten.' })).toEqual({
      body: 'Rewritten.',
    })
    expect(changedFields(bean, { ...pristine, body: 'Original body.' })).toEqual({})
  })

  it('reports several changes together', () => {
    expect(
      changedFields(bean, { ...pristine, title: 'New', status: 'draft', tags: [] })
    ).toEqual({ title: 'New', status: 'draft', tags: [] })
  })

  it('never reports assignee, which beans cannot store', () => {
    // beans has no assignee field, so it must never reach a write payload.
    expect(changedFields(bean, pristine)).not.toHaveProperty('assignee')
    expect(changedFields(bean, { ...pristine, title: 'New' })).not.toHaveProperty('assignee')
  })
})
