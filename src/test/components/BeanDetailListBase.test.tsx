// T5 (P.-2jcn / P.-t4yv), frontend half: a tag, blocking or blocked_by edit is
// sent with the list it started from (expectTags / expectBlocking /
// expectBlockedBy), so the backend diffs against the edit's own base. That base
// is fixed when editing starts: a refresh of the bean while the edit is open
// (the watcher reloading it after someone else's change) must not move it.
// The backend half is src-tauri/tests/t5_field_merge.rs.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ComponentProps } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { BeanDetail } from '../../components/BeanDetail'
import { updateBean } from '../../lib/tauri'
import type { Bean } from '../../types/beans'

type OnSave = NonNullable<ComponentProps<typeof BeanDetail>['onSave']>

const TAGS_PLACEHOLDER = 'tag1, tag2, tag3'

function mk(id: string, extra: Partial<Bean> = {}): Bean {
  return {
    id,
    title: `Title ${id}`,
    status: 'todo',
    bean_type: 'task',
    parent: null,
    tags: [],
    priority: null,
    created_at: '2026-10-20T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z',
    body: 'Body.',
    file_path: `/project/.beans/${id}--x.md`,
    children: [],
    blocking: [],
    blocked_by: [],
    ...extra,
  } as Bean
}

const others = [mk('bean-b1'), mk('bean-b2'), mk('bean-b3'), mk('bean-k1'), mk('bean-k2'), mk('bean-k3')]

const props = {
  onOpenInEditor: vi.fn(),
  onStatusChange: vi.fn(),
  availableStatuses: ['todo', 'in-progress', 'completed'],
  projectPath: '/project',
}

function setup(bean: Bean, onSave: OnSave) {
  const utils = render(<BeanDetail {...props} bean={bean} allBeans={[bean, ...others]} onSave={onSave} />)
  fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
  return {
    refresh: (b: Bean) => utils.rerender(<BeanDetail {...props} bean={b} allBeans={[b, ...others]} onSave={onSave} />),
    save: async () => { await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Save$/i })) }) },
  }
}

describe('T5 list edits carry their base (P.-t4yv)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends the tags the edit started from with a tag change', async () => {
    const onSave = vi.fn<OnSave>().mockResolvedValue(undefined)
    const { save } = setup(mk('bean-t5', { tags: ['base'] }), onSave)
    fireEvent.change(screen.getByPlaceholderText(TAGS_PLACEHOLDER), { target: { value: 'base, mine' } })
    await save()
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0]).toMatchObject({ tags: ['base', 'mine'], expectTags: ['base'] })
  })

  it('keeps the edit-start tags as the base when the bean is refreshed mid-edit', async () => {
    const onSave = vi.fn<OnSave>().mockResolvedValue(undefined)
    const { refresh, save } = setup(mk('bean-t5', { tags: ['base'] }), onSave)
    fireEvent.change(screen.getByPlaceholderText(TAGS_PLACEHOLDER), { target: { value: 'base, mine' } })
    // Someone else added a tag; the watcher reloads the bean under the open editor.
    refresh(mk('bean-t5', { tags: ['base', 'theirs'] }))
    await save()
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave.mock.calls[0][0]).toMatchObject({ tags: ['base', 'mine'], expectTags: ['base'] })
  })

  it('sends the blocking list the edit started from, refreshed or not', async () => {
    const onSave = vi.fn<OnSave>().mockResolvedValue(undefined)
    const { refresh, save } = setup(mk('bean-t5', { blocking: ['bean-b1', 'bean-b2'] }), onSave)
    fireEvent.click(screen.getByTitle('Remove bean-b2'))
    refresh(mk('bean-t5', { blocking: ['bean-b1', 'bean-b2', 'bean-b3'] }))
    await save()
    expect(onSave.mock.calls[0][0]).toMatchObject({ blocking: ['bean-b1'], expectBlocking: ['bean-b1', 'bean-b2'] })
  })

  it('sends the blocked_by list the edit started from, refreshed or not', async () => {
    const onSave = vi.fn<OnSave>().mockResolvedValue(undefined)
    const { refresh, save } = setup(mk('bean-t5', { blocked_by: ['bean-k1', 'bean-k2'] }), onSave)
    fireEvent.click(screen.getByTitle('Remove bean-k1'))
    refresh(mk('bean-t5', { blocked_by: ['bean-k1', 'bean-k2', 'bean-k3'] }))
    await save()
    expect(onSave.mock.calls[0][0]).toMatchObject({ blocked_by: ['bean-k2'], expectBlockedBy: ['bean-k1', 'bean-k2'] })
  })

  it('control: a title-only save carries no list bases', async () => {
    const onSave = vi.fn<OnSave>().mockResolvedValue(undefined)
    const { save } = setup(mk('bean-t5', { tags: ['base'], blocking: ['bean-b1'] }), onSave)
    fireEvent.change(screen.getByPlaceholderText('Bean title'), { target: { value: 'New title' } })
    await save()
    expect(onSave).toHaveBeenCalledWith({ title: 'New title' })
  })

  it('passes the list bases through to the update_bean invoke', async () => {
    vi.mocked(invoke).mockResolvedValue(mk('bean-t5'))
    await updateBean({
      projectPath: '/project',
      beanId: 'bean-t5',
      tags: ['base', 'mine'],
      blocking: ['bean-b1'],
      blockedBy: ['bean-k2'],
      expectTags: ['base'],
      expectBlocking: ['bean-b1', 'bean-b2'],
      expectBlockedBy: ['bean-k1', 'bean-k2'],
    } as Parameters<typeof updateBean>[0])
    expect(invoke).toHaveBeenCalledWith(
      'update_bean',
      expect.objectContaining({
        expectTags: ['base'],
        expectBlocking: ['bean-b1', 'bean-b2'],
        expectBlockedBy: ['bean-k1', 'bean-k2'],
      })
    )
  })
})
