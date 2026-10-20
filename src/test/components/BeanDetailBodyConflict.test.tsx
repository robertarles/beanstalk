// T4 (P.-2jcn), frontend half: a body save refused with CONFLICT keeps the typed
// body in the editor, stays in edit mode and says why; the base body travels
// with the save all the way to the `update_bean` invoke.
// The backend half is src-tauri/tests/t4_body_conflict.rs.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { BeanDetail } from '../../components/BeanDetail'
import { updateBean } from '../../lib/tauri'
import type { Bean } from '../../types/beans'

const BODY_PLACEHOLDER = /Markdown body/

const bean: Bean = {
  id: 'bean-t4',
  title: 'Conflicted bean',
  status: 'todo',
  bean_type: 'task',
  parent: null,
  tags: [],
  priority: null,
  created_at: '2026-10-20T00:00:00Z',
  updated_at: '2026-10-20T00:00:00Z',
  body: 'Base body.',
  file_path: '/project/.beans/bean-t4--conflicted-bean.md',
  children: [],
  blocking: [],
  blocked_by: [],
}

const props = {
  bean,
  onOpenInEditor: vi.fn(),
  onStatusChange: vi.fn(),
  availableStatuses: ['todo', 'in-progress', 'completed'],
  projectPath: '/project',
}

async function editBodyAndSave(onSave: ReturnType<typeof vi.fn>, typed: string) {
  render(<BeanDetail {...props} onSave={onSave} />)
  fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
  fireEvent.change(screen.getByPlaceholderText(BODY_PLACEHOLDER), { target: { value: typed } })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Save$/i })) })
}

describe('T4 body conflict (P.-2jcn)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends the body it started from with a body change', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    await editBodyAndSave(onSave, 'My careful edit.')
    expect(onSave).toHaveBeenCalledWith({ body: 'My careful edit.', expectBody: 'Base body.' })
  })

  it('keeps the typed body, stays in edit mode and explains on CONFLICT', async () => {
    const onSave = vi.fn().mockRejectedValue({ code: 'CONFLICT', message: 'This bean changed on disk.' })
    await editBodyAndSave(onSave, 'My careful edit.')
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(screen.getByPlaceholderText(BODY_PLACEHOLDER)).toHaveValue('My careful edit.')
    expect(screen.getByRole('button', { name: /^Save$/i })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('This bean changed on disk.')
  })

  it('control: a successful body save leaves edit mode', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    await editBodyAndSave(onSave, 'Saved fine.')
    expect(screen.queryByRole('button', { name: /^Save$/i })).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText(BODY_PLACEHOLDER)).not.toBeInTheDocument()
  })

  it('passes expectBody through to the update_bean invoke', async () => {
    vi.mocked(invoke).mockResolvedValue(bean)
    await updateBean({ projectPath: '/project', beanId: 'bean-t4', body: 'Mine', expectBody: 'Base body.' })
    expect(invoke).toHaveBeenCalledWith('update_bean', expect.objectContaining({ body: 'Mine', expectBody: 'Base body.' }))
  })
})
