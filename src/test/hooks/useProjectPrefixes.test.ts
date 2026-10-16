import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { useProjectPrefixes } from '../../hooks/useProjectPrefixes'
import type { Project } from '../../types/beans'

const mockInvoke = vi.mocked(invoke)

const projects: Project[] = [
  { path: '/src/beanstalk', name: 'beanstalk' },
  { path: '/src/hivelens', name: 'hivelens' },
]

describe('useProjectPrefixes (beanstalk-1j24)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('builds a routing map from the configured projects', async () => {
    mockInvoke.mockResolvedValue([
      { path: '/src/beanstalk', name: 'beanstalk', prefix: 'beanstalk-' },
      { path: '/src/hivelens', name: 'hivelens', prefix: 'hivelens-' },
    ])
    const { result } = renderHook(() => useProjectPrefixes(projects))
    await waitFor(() => expect(result.current.entries).toHaveLength(2))
    expect(mockInvoke).toHaveBeenCalledWith('get_project_prefixes')
  })

  it('stays empty when no projects are configured, without calling the backend', () => {
    const { result } = renderHook(() => useProjectPrefixes([]))
    expect(result.current.entries).toEqual([])
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('stays empty when the config has not loaded yet', () => {
    const { result } = renderHook(() => useProjectPrefixes(undefined))
    expect(result.current.entries).toEqual([])
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('degrades to an empty map when the lookup fails rather than throwing', async () => {
    mockInvoke.mockRejectedValue(new Error('no config'))
    const { result } = renderHook(() => useProjectPrefixes(projects))
    await waitFor(() => expect(result.current.entries).toEqual([]))
  })

  it('does not reload when the array identity changes but the paths do not', async () => {
    mockInvoke.mockResolvedValue([{ path: '/src/beanstalk', name: 'beanstalk', prefix: 'beanstalk-' }])
    const { result, rerender } = renderHook(({ p }: { p: Project[] }) => useProjectPrefixes(p), {
      initialProps: { p: [...projects] },
    })
    await waitFor(() => expect(result.current.entries).toHaveLength(1))
    rerender({ p: [...projects] })
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it('reloads when a project is added', async () => {
    mockInvoke.mockResolvedValue([{ path: '/src/beanstalk', name: 'beanstalk', prefix: 'beanstalk-' }])
    const { rerender } = renderHook(({ p }: { p: Project[] }) => useProjectPrefixes(p), {
      initialProps: { p: [projects[0]] },
    })
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledTimes(1))
    rerender({ p: projects })
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledTimes(2))
  })
})
