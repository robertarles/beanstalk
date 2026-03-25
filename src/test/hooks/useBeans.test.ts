import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useBeans } from '../../hooks/useBeans'
import type { Bean } from '../../types/beans'

const mockInvoke = vi.mocked(invoke)
const mockListen = vi.mocked(listen)

const sampleBeans: Bean[] = [
  {
    id: 'bean-001',
    title: 'Test Bean',
    status: 'todo',
    bean_type: 'task',
    parent: null,
    tags: [],
    assignee: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    body: '',
    file_path: '/path/to/bean.md',
    children: [],
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mockListen.mockResolvedValue(() => {})
})

describe('useBeans', () => {
  it('loads beans on mount when projectPath is set', async () => {
    mockInvoke.mockResolvedValue(sampleBeans)

    const { result } = renderHook(() => useBeans('/path/to/project'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockInvoke).toHaveBeenCalledWith('get_beans', { projectPath: '/path/to/project' })
    expect(result.current.beans).toEqual(sampleBeans)
    expect(result.current.error).toBeNull()
  })

  it('returns empty array when projectPath is null', async () => {
    const { result } = renderHook(() => useBeans(null))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockInvoke).not.toHaveBeenCalled()
    expect(result.current.beans).toEqual([])
  })

  it('refresh() reloads beans', async () => {
    mockInvoke.mockResolvedValue(sampleBeans)

    const { result } = renderHook(() => useBeans('/path/to/project'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockInvoke).toHaveBeenCalledTimes(1)

    result.current.refresh()

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledTimes(2)
    })

    expect(mockInvoke).toHaveBeenNthCalledWith(2, 'get_beans', { projectPath: '/path/to/project' })
  })
})
