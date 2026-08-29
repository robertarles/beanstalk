import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, cleanup, act } from '@testing-library/react'
import { useKeyboardNav } from '../../hooks/useKeyboardNav'

afterEach(cleanup)

/**
 * Dispatch a keydown the way a browser would. tinykeys matches on both
 * `event.key` and `event.code`, so both are supplied.
 */
function press(
  key: string,
  code: string,
  target: EventTarget = document,
  modifiers: KeyboardEventInit = {}
) {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true, ...modifiers })
  )
}

function setup(overrides = {}) {
  const handlers = {
    onOpenActionMenu: vi.fn(),
    onOpenInEditor: vi.fn(),
    onSelectIndex: vi.fn(),
    ...overrides,
  }
  renderHook(() => useKeyboardNav({ beanCount: 3, ...handlers }))
  return handlers
}

describe('useKeyboardNav — action menu binding', () => {
  it('opens the action menu on Space', () => {
    // tinykeys splits binding strings on spaces to express sequences, so the
    // space key has to be bound as "Space". A regression here fails silently.
    const { onOpenActionMenu } = setup()
    press(' ', 'Space')
    expect(onOpenActionMenu).toHaveBeenCalledTimes(1)
  })

  it('keeps `e` as a direct jump to the external editor', () => {
    const { onOpenInEditor, onOpenActionMenu } = setup()
    press('e', 'KeyE')
    expect(onOpenInEditor).toHaveBeenCalledTimes(1)
    expect(onOpenActionMenu).not.toHaveBeenCalled()
  })

  it('binds `i` to inline edit mode, not the external editor', () => {
    const onEnterEditMode = vi.fn()
    const { onOpenInEditor } = setup({ onEnterEditMode })
    press('i', 'KeyI')
    expect(onEnterEditMode).toHaveBeenCalledTimes(1)
    expect(onOpenInEditor).not.toHaveBeenCalled()
  })

  it('ignores Space while typing in an input', () => {
    const { onOpenActionMenu } = setup()
    const input = document.createElement('input')
    document.body.appendChild(input)
    press(' ', 'Space', input)
    input.remove()
    expect(onOpenActionMenu).not.toHaveBeenCalled()
  })

  it('ignores Space while the help overlay is open', () => {
    const handlers = { onOpenActionMenu: vi.fn(), onSelectIndex: vi.fn() }
    const { result } = renderHook(() => useKeyboardNav({ beanCount: 3, ...handlers }))
    // `?` is Shift+/ — without the modifier the binding never matches.
    act(() => press('?', 'Slash', document, { shiftKey: true }))
    expect(result.current.isModalOpen).toBe(true)
    press(' ', 'Space')
    expect(handlers.onOpenActionMenu).not.toHaveBeenCalled()
  })

  it('does not throw when no action-menu handler is supplied', () => {
    renderHook(() => useKeyboardNav({ beanCount: 0, onSelectIndex: vi.fn() }))
    expect(() => press(' ', 'Space')).not.toThrow()
  })
})
