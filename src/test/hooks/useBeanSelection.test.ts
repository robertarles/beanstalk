import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useBeanSelection } from '../../hooks/useBeanSelection'
import type { Bean } from '../../types/beans'

function bean(id: string, children: Bean[] = []): Bean {
  return {
    id,
    title: `Bean ${id}`,
    status: 'todo',
    bean_type: 'task',
    parent: null,
    tags: [],
    priority: null,
    assignee: null,
    created_at: null,
    updated_at: null,
    body: '',
    file_path: `/p/.beans/${id}.md`,
    children,
    blocking: [],
    blocked_by: [],
  }
}

interface Opts {
  activeProject: string | null
  beans: Bean[]
  beansLoading: boolean
  setActiveProject: (p: string) => Promise<void>
  select: (id: string) => void
  onError: (m: string) => void
}

const HERE = '/src/beanstalk'
const THERE = '/src/hivelens'

function setup(over: Partial<Opts> = {}) {
  const select = vi.fn()
  const onError = vi.fn()
  const setActiveProject = vi.fn(async () => {})
  const initial: Opts = {
    activeProject: HERE,
    beans: [bean('beanstalk-msdy', [bean('beanstalk-4ad6')])],
    beansLoading: false,
    setActiveProject,
    select,
    onError,
    ...over,
  }
  const hook = renderHook((props: Opts) => useBeanSelection(props), { initialProps: initial })
  return { ...hook, select, onError, setActiveProject, initial }
}

describe('useBeanSelection (beanstalk-wrvx)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('selects immediately when no project is given', async () => {
    const { result, select, setActiveProject } = setup()
    await act(async () => { await result.current('beanstalk-4ad6') })
    expect(select).toHaveBeenCalledWith('beanstalk-4ad6')
    expect(setActiveProject).not.toHaveBeenCalled()
  })

  it('selects immediately when the project is the one already active', async () => {
    const { result, select, setActiveProject } = setup()
    await act(async () => { await result.current('beanstalk-4ad6', HERE) })
    expect(select).toHaveBeenCalledWith('beanstalk-4ad6')
    expect(setActiveProject).not.toHaveBeenCalled()
  })

  it('switches project and selects once the new beans have settled', async () => {
    const { result, rerender, select, setActiveProject, initial } = setup()

    await act(async () => { await result.current('hivelens-7k2p', THERE) })
    expect(setActiveProject).toHaveBeenCalledWith(THERE)
    // Nothing selected yet: the target does not exist in the old tree.
    expect(select).not.toHaveBeenCalled()

    // The switch lands, beans still loading — must not act on a stale tree.
    rerender({ ...initial, activeProject: THERE, beans: [], beansLoading: true })
    expect(select).not.toHaveBeenCalled()

    rerender({ ...initial, activeProject: THERE, beans: [bean('hivelens-7k2p')], beansLoading: false })
    await waitFor(() => expect(select).toHaveBeenCalledWith('hivelens-7k2p'))
  })

  it('finds a target nested deep in the new project', async () => {
    const { result, rerender, select, initial } = setup()
    await act(async () => { await result.current('hivelens-deep', THERE) })
    rerender({
      ...initial,
      activeProject: THERE,
      beans: [bean('hivelens-top', [bean('hivelens-mid', [bean('hivelens-deep')])])],
      beansLoading: false,
    })
    await waitFor(() => expect(select).toHaveBeenCalledWith('hivelens-deep'))
  })

  it('reports a target that turns out not to exist, and stays switched', async () => {
    const { result, rerender, select, onError, initial } = setup()
    await act(async () => { await result.current('hivelens-gone', THERE) })
    rerender({ ...initial, activeProject: THERE, beans: [bean('hivelens-other')], beansLoading: false })
    await waitFor(() => expect(onError).toHaveBeenCalledWith('hivelens-gone is missing or archived'))
    expect(select).not.toHaveBeenCalled()
  })

  it('reports a failed project switch and parks nothing', async () => {
    const setActiveProject = vi.fn(async () => { throw new Error('Project not found in config') })
    const { result, rerender, select, onError, initial } = setup({ setActiveProject })

    await act(async () => { await result.current('hivelens-7k2p', THERE) })
    expect(onError).toHaveBeenCalledWith('Project not found in config')

    // The parked request was dropped, so a later settle must not select it.
    rerender({ ...initial, activeProject: THERE, beans: [bean('hivelens-7k2p')], beansLoading: false })
    expect(select).not.toHaveBeenCalled()
  })

  it('reports a non-Error rejection with a fallback message', async () => {
    const setActiveProject = vi.fn(async () => { throw 'nope' })
    const { result, onError } = setup({ setActiveProject })
    await act(async () => { await result.current('hivelens-7k2p', THERE) })
    expect(onError).toHaveBeenCalledWith('Failed to switch project')
  })

  it('applies a parked selection only once', async () => {
    const { result, rerender, select, initial } = setup()
    await act(async () => { await result.current('hivelens-7k2p', THERE) })

    const settled = { ...initial, activeProject: THERE, beans: [bean('hivelens-7k2p')], beansLoading: false }
    rerender(settled)
    await waitFor(() => expect(select).toHaveBeenCalledTimes(1))

    // A later unrelated re-render must not re-apply the consumed request.
    rerender({ ...settled, beans: [bean('hivelens-7k2p'), bean('hivelens-new')] })
    expect(select).toHaveBeenCalledTimes(1)
  })

  it('ignores bean changes when nothing is parked', () => {
    const { rerender, select, onError, initial } = setup()
    rerender({ ...initial, beans: [bean('beanstalk-other')] })
    expect(select).not.toHaveBeenCalled()
    expect(onError).not.toHaveBeenCalled()
  })
})
