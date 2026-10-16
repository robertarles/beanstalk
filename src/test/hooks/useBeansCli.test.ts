import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { useBeansCli } from '../../hooks/useBeansCli'

const mockInvoke = vi.mocked(invoke)

describe('useBeansCli (beanstalk-dg1m)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('assumes unavailable until the check answers', () => {
    mockInvoke.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useBeansCli())
    // Writes must never be offered before we know, so the default is closed.
    expect(result.current.available).toBe(false)
    expect(result.current.resolved).toBe(false)
  })

  it('reports availability and the resolved binary', async () => {
    mockInvoke.mockResolvedValue({
      available: true,
      path: '/home/robert/.local/bin/beans',
      version: 'beans 1.2.3',
      error: null,
    })
    const { result } = renderHook(() => useBeansCli())
    await waitFor(() => expect(result.current.resolved).toBe(true))
    expect(result.current.available).toBe(true)
    expect(result.current.path).toBe('/home/robert/.local/bin/beans')
    expect(mockInvoke).toHaveBeenCalledWith('beans_cli_status')
  })

  it('carries the reason when the binary is missing', async () => {
    mockInvoke.mockResolvedValue({
      available: false,
      path: null,
      version: null,
      error: '`beans` not found on PATH',
    })
    const { result } = renderHook(() => useBeansCli())
    await waitFor(() => expect(result.current.resolved).toBe(true))
    expect(result.current.available).toBe(false)
    expect(result.current.error).toBe('`beans` not found on PATH')
  })

  it('stays unavailable when the check itself fails', async () => {
    mockInvoke.mockRejectedValue(new Error('ipc exploded'))
    const { result } = renderHook(() => useBeansCli())
    await waitFor(() => expect(result.current.resolved).toBe(true))
    expect(result.current.available).toBe(false)
    expect(result.current.error).toBe('ipc exploded')
  })

  it('checks once per session', async () => {
    mockInvoke.mockResolvedValue({ available: true, path: '/x', version: null, error: null })
    const { result, rerender } = renderHook(() => useBeansCli())
    await waitFor(() => expect(result.current.resolved).toBe(true))
    rerender()
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })
})
