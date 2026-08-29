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

describe('useKeyboardNav — gg / G jump bindings', () => {
  it('jumps to the top on `g g`', () => {
    const { onSelectIndex } = setup()
    press('g', 'KeyG')
    press('g', 'KeyG')
    expect(onSelectIndex).toHaveBeenCalledWith(0)
  })

  it('jumps to the bottom on Shift+G', () => {
    const { onSelectIndex } = setup()
    press('G', 'KeyG', document, { shiftKey: true })
    expect(onSelectIndex).toHaveBeenCalledWith(2)
  })

  it('does not jump on a single `g`', () => {
    // tinykeys compares keys case-insensitively, so a bare `G` binding also
    // matches a plain `g` press and would fire alongside the `g` handler --
    // making one `g` behave like `G` and breaking the `gg` sequence.
    const { onSelectIndex } = setup()
    press('g', 'KeyG')
    expect(onSelectIndex).not.toHaveBeenCalled()
  })

  it('does not treat `g` then Shift+G as a jump to the top', () => {
    const { onSelectIndex } = setup()
    press('g', 'KeyG')
    press('G', 'KeyG', document, { shiftKey: true })
    expect(onSelectIndex).toHaveBeenCalledWith(2)
    expect(onSelectIndex).not.toHaveBeenCalledWith(0)
  })
})

describe('useKeyboardNav — gg sequence timeout', () => {
  afterEach(() => vi.useRealTimers())

  it('forgets a pending `g` after the 500ms window', () => {
    vi.useFakeTimers()
    const { onSelectIndex } = setup()
    press('g', 'KeyG')
    act(() => {
      vi.advanceTimersByTime(600)
    })
    press('g', 'KeyG')
    // The second `g` starts a fresh sequence rather than completing the first.
    expect(onSelectIndex).not.toHaveBeenCalled()
  })

  it('still completes when the two presses are inside the window', () => {
    vi.useFakeTimers()
    const { onSelectIndex } = setup()
    press('g', 'KeyG')
    act(() => {
      vi.advanceTimersByTime(100)
    })
    press('g', 'KeyG')
    expect(onSelectIndex).toHaveBeenCalledWith(0)
  })
})
