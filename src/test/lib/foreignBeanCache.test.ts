import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invoke } from '@tauri-apps/api/core'
import {
  loadForeignBean,
  peekForeignBean,
  foreignBeanKey,
  resetForeignBeanCache,
} from '../../lib/foreignBeanCache'

const mockInvoke = vi.mocked(invoke)

const THERE = '/src/hivelens'

describe('foreignBeanCache (beanstalk-kstx)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetForeignBeanCache()
  })

  it('fetches one bean and reports its title', async () => {
    mockInvoke.mockResolvedValue({ id: 'hivelens-7k2p', title: 'UTM provider drops the campaign' })
    const state = await loadForeignBean(THERE, 'hivelens-7k2p')
    expect(state).toEqual({ status: 'found', title: 'UTM provider drops the campaign' })
    expect(mockInvoke).toHaveBeenCalledWith('get_bean', {
      projectPath: THERE,
      beanId: 'hivelens-7k2p',
    })
  })

  it('distinguishes a missing bean from an unreadable project', async () => {
    mockInvoke.mockRejectedValue('Bean not found: hivelens-gone')
    expect(await loadForeignBean(THERE, 'hivelens-gone')).toEqual({ status: 'missing' })

    resetForeignBeanCache()
    mockInvoke.mockRejectedValue(new Error('Permission denied'))
    expect(await loadForeignBean(THERE, 'hivelens-7k2p')).toEqual({ status: 'error' })
  })

  it('caches a hit, so a second lookup makes no call', async () => {
    mockInvoke.mockResolvedValue({ id: 'hivelens-7k2p', title: 'Cached' })
    await loadForeignBean(THERE, 'hivelens-7k2p')
    await loadForeignBean(THERE, 'hivelens-7k2p')
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it('caches a miss too, so hovering a dead link does not refetch', async () => {
    mockInvoke.mockRejectedValue('Bean not found: hivelens-gone')
    await loadForeignBean(THERE, 'hivelens-gone')
    await loadForeignBean(THERE, 'hivelens-gone')
    expect(mockInvoke).toHaveBeenCalledTimes(1)
    expect(peekForeignBean(THERE, 'hivelens-gone')).toEqual({ status: 'missing' })
  })

  it('does not cache an unreadable project, which may be transient', async () => {
    mockInvoke.mockRejectedValue(new Error('Permission denied'))
    await loadForeignBean(THERE, 'hivelens-7k2p')
    expect(peekForeignBean(THERE, 'hivelens-7k2p')).toEqual({ status: 'unknown' })

    mockInvoke.mockResolvedValue({ id: 'hivelens-7k2p', title: 'Readable now' })
    expect(await loadForeignBean(THERE, 'hivelens-7k2p')).toEqual({
      status: 'found',
      title: 'Readable now',
    })
  })

  it('collapses concurrent lookups of the same bean into one call', async () => {
    mockInvoke.mockResolvedValue({ id: 'hivelens-7k2p', title: 'Once' })
    const [a, b] = await Promise.all([
      loadForeignBean(THERE, 'hivelens-7k2p'),
      loadForeignBean(THERE, 'hivelens-7k2p'),
    ])
    expect(a).toEqual(b)
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it('reports nothing known before a lookup', () => {
    expect(peekForeignBean(THERE, 'hivelens-7k2p')).toEqual({ status: 'unknown' })
  })

  it('keys case-insensitively on the id but distinctly per project', () => {
    expect(foreignBeanKey(THERE, 'HIVELENS-7K2P')).toBe(foreignBeanKey(THERE, 'hivelens-7k2p'))
    expect(foreignBeanKey('/src/other', 'hivelens-7k2p')).not.toBe(
      foreignBeanKey(THERE, 'hivelens-7k2p')
    )
  })
})
