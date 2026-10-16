import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { useForeignBeanPreview } from '../../hooks/useForeignBeanPreview'
import { resetForeignBeanCache } from '../../lib/foreignBeanCache'

const mockInvoke = vi.mocked(invoke)
const THERE = '/src/hivelens'

describe('useForeignBeanPreview (beanstalk-kstx)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetForeignBeanCache()
  })

  it('makes no call until enabled', () => {
    const { result } = renderHook(() => useForeignBeanPreview(THERE, 'hivelens-7k2p', false))
    expect(result.current).toEqual({ status: 'unknown' })
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('fetches once enabled and reports the title', async () => {
    mockInvoke.mockResolvedValue({ id: 'hivelens-7k2p', title: 'The other bean' })
    const { result } = renderHook(() => useForeignBeanPreview(THERE, 'hivelens-7k2p', true))
    await waitFor(() => expect(result.current).toEqual({ status: 'found', title: 'The other bean' }))
  })

  it('makes no call for a local link', () => {
    const { result } = renderHook(() => useForeignBeanPreview(null, null, true))
    expect(result.current).toEqual({ status: 'unknown' })
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('serves a cached result without enabling', async () => {
    mockInvoke.mockResolvedValue({ id: 'hivelens-7k2p', title: 'Warm' })
    const first = renderHook(() => useForeignBeanPreview(THERE, 'hivelens-7k2p', true))
    await waitFor(() => expect(first.result.current.status).toBe('found'))

    const second = renderHook(() => useForeignBeanPreview(THERE, 'hivelens-7k2p', false))
    await waitFor(() => expect(second.result.current).toEqual({ status: 'found', title: 'Warm' }))
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it('reports a missing foreign bean', async () => {
    mockInvoke.mockRejectedValue('Bean not found: hivelens-gone')
    const { result } = renderHook(() => useForeignBeanPreview(THERE, 'hivelens-gone', true))
    await waitFor(() => expect(result.current).toEqual({ status: 'missing' }))
  })

  it('reports an unreadable project as an error, not as missing', async () => {
    mockInvoke.mockRejectedValue(new Error('Permission denied'))
    const { result } = renderHook(() => useForeignBeanPreview(THERE, 'hivelens-7k2p', true))
    await waitFor(() => expect(result.current).toEqual({ status: 'error' }))
  })
})
