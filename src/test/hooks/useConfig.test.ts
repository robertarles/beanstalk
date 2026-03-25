import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { useConfig } from '../../hooks/useConfig'
import type { AppConfig } from '../../types/beans'

const mockInvoke = vi.mocked(invoke)

const sampleConfig: AppConfig = {
  projects: [{ path: '/path/to/project', name: 'My Project' }],
  last_active_project: '/path/to/project',
  editor: null,
}

const updatedConfig: AppConfig = {
  projects: [
    { path: '/path/to/project', name: 'My Project' },
    { path: '/path/to/other', name: 'Other Project' },
  ],
  last_active_project: '/path/to/project',
  editor: null,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useConfig', () => {
  it('loads config on mount', async () => {
    mockInvoke.mockResolvedValue(sampleConfig)

    const { result } = renderHook(() => useConfig())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockInvoke).toHaveBeenCalledWith('get_config')
    expect(result.current.config).toEqual(sampleConfig)
  })

  it('addProject calls invoke with correct args', async () => {
    mockInvoke
      .mockResolvedValueOnce(sampleConfig)
      .mockResolvedValueOnce(updatedConfig)

    const { result } = renderHook(() => useConfig())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.addProject('/path/to/other')
    })

    expect(mockInvoke).toHaveBeenCalledWith('add_project', { path: '/path/to/other' })
    expect(result.current.config).toEqual(updatedConfig)
  })

  it('removeProject calls invoke with correct args', async () => {
    mockInvoke
      .mockResolvedValueOnce(updatedConfig)
      .mockResolvedValueOnce(sampleConfig)

    const { result } = renderHook(() => useConfig())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.removeProject('/path/to/other')
    })

    expect(mockInvoke).toHaveBeenCalledWith('remove_project', { path: '/path/to/other' })
    expect(result.current.config).toEqual(sampleConfig)
  })
})
