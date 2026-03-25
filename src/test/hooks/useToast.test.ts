import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from '../../hooks/useToast'

describe('useToast', () => {
  it('showToast adds a toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast('Hello world', 'success')
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Hello world')
    expect(result.current.toasts[0].type).toBe('success')
    expect(typeof result.current.toasts[0].id).toBe('number')
  })

  it('dismissToast removes a toast by id', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.showToast('First toast', 'error')
      result.current.showToast('Second toast', 'success')
    })

    expect(result.current.toasts).toHaveLength(2)

    const idToRemove = result.current.toasts[0].id

    act(() => {
      result.current.dismissToast(idToRemove)
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Second toast')
  })
})
