import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BeanActionMenu } from '../../components/BeanActionMenu'
import type { BeanScript } from '../../types/beans'

function makeScript(overrides: Partial<BeanScript> = {}): BeanScript {
  return {
    id: 'jira.sh',
    name: 'Open Jira issue',
    description: 'Opens the linked ticket',
    key: null,
    path: '/scripts/jira.sh',
    scope: 'global',
    timeout_secs: 30,
    ...overrides,
  }
}

const defaults = {
  open: true,
  anchor: { x: 100, y: 100 },
  beanTitle: 'Fix the thing',
  loading: false,
  scriptsDirs: ['/global/scripts', '/proj/.beanstalk/scripts'],
}

function renderMenu(props: Partial<React.ComponentProps<typeof BeanActionMenu>> = {}) {
  const onEditExternal = vi.fn()
  const onRun = vi.fn()
  const onClose = vi.fn()
  const utils = render(
    <BeanActionMenu
      {...defaults}
      scripts={[]}
      onEditExternal={onEditExternal}
      onRun={onRun}
      onClose={onClose}
      {...props}
    />
  )
  return { ...utils, onEditExternal, onRun, onClose, menu: screen.queryByRole('menu') }
}

beforeEach(() => {
  // clampToViewport reads these; jsdom defaults are fine but pin them anyway.
  window.innerWidth = 1200
  window.innerHeight = 800
})

describe('BeanActionMenu', () => {
  it('renders nothing when closed', () => {
    renderMenu({ open: false })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('renders nothing without an anchor', () => {
    renderMenu({ anchor: null })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('always lists Edit (external) first, even with no scripts', () => {
    renderMenu()
    const items = screen.getAllByRole('menuitem')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('Edit (external)')
  })

  it('lists discovered scripts after the pinned edit entry', () => {
    renderMenu({ scripts: [makeScript(), makeScript({ id: 'b.sh', name: 'Second' })] })
    const items = screen.getAllByRole('menuitem')
    expect(items.map((el) => el.textContent?.split('Opens')[0])).toEqual([
      expect.stringContaining('Edit (external)'),
      expect.stringContaining('Open Jira issue'),
      expect.stringContaining('Second'),
    ])
  })

  it('badges project-scoped scripts so shadowing is visible', () => {
    renderMenu({ scripts: [makeScript({ scope: 'project' })] })
    expect(screen.getByText('project')).toBeInTheDocument()
  })

  it('shows where to put scripts when none were found', () => {
    renderMenu()
    expect(screen.getByText('/proj/.beanstalk/scripts')).toBeInTheDocument()
  })

  it('does not show the empty-state hint while still loading', () => {
    renderMenu({ loading: true })
    expect(screen.getByText('Loading scripts…')).toBeInTheDocument()
    expect(screen.queryByText('/proj/.beanstalk/scripts')).toBeNull()
  })

  it('runs the pinned edit entry on Enter (Space then Enter reaches the editor)', () => {
    const { onEditExternal, onRun, onClose } = renderMenu({ scripts: [makeScript()] })
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Enter' })
    expect(onEditExternal).toHaveBeenCalledTimes(1)
    expect(onRun).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('navigates with j and runs the highlighted script', () => {
    const { onRun } = renderMenu({ scripts: [makeScript()] })
    const menu = screen.getByRole('menu')
    fireEvent.keyDown(menu, { key: 'j' })
    fireEvent.keyDown(menu, { key: 'Enter' })
    expect(onRun).toHaveBeenCalledWith('jira.sh')
  })

  it('navigates with arrow keys as well as j/k', () => {
    const { onRun, onEditExternal } = renderMenu({ scripts: [makeScript()] })
    const menu = screen.getByRole('menu')
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    fireEvent.keyDown(menu, { key: 'Enter' })
    expect(onEditExternal).toHaveBeenCalled()
    expect(onRun).not.toHaveBeenCalled()
  })

  it('clamps navigation at both ends of the list', () => {
    const { onRun } = renderMenu({ scripts: [makeScript()] })
    const menu = screen.getByRole('menu')
    // Past the end, then back past the start.
    fireEvent.keyDown(menu, { key: 'k' })
    fireEvent.keyDown(menu, { key: 'j' })
    fireEvent.keyDown(menu, { key: 'j' })
    fireEvent.keyDown(menu, { key: 'j' })
    fireEvent.keyDown(menu, { key: 'Enter' })
    expect(onRun).toHaveBeenCalledWith('jira.sh')
  })

  it('supports G and g to jump to the ends', () => {
    const { onRun, onEditExternal } = renderMenu({
      scripts: [makeScript(), makeScript({ id: 'last.sh', name: 'Zulu last' })],
    })
    const menu = screen.getByRole('menu')
    fireEvent.keyDown(menu, { key: 'G' })
    fireEvent.keyDown(menu, { key: 'Enter' })
    expect(onRun).toHaveBeenCalledWith('last.sh')

    fireEvent.keyDown(menu, { key: 'g' })
    fireEvent.keyDown(menu, { key: 'Enter' })
    expect(onEditExternal).toHaveBeenCalled()
  })

  it('runs a script via its declared accelerator', () => {
    const { onRun } = renderMenu({ scripts: [makeScript({ key: 'J' })] })
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'J' })
    expect(onRun).toHaveBeenCalledWith('jira.sh')
  })

  it('does not let an accelerator shadow a navigation key', () => {
    // A script declaring `j` must still leave j as "move down".
    const { onRun, onEditExternal } = renderMenu({ scripts: [makeScript({ key: 'j' })] })
    const menu = screen.getByRole('menu')
    fireEvent.keyDown(menu, { key: 'j' })
    expect(onRun).not.toHaveBeenCalled()
    fireEvent.keyDown(menu, { key: 'Enter' })
    expect(onRun).toHaveBeenCalledWith('jira.sh')
    expect(onEditExternal).not.toHaveBeenCalled()
  })

  it('closes on Escape without running anything', () => {
    const { onClose, onRun, onEditExternal } = renderMenu({ scripts: [makeScript()] })
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onRun).not.toHaveBeenCalled()
    expect(onEditExternal).not.toHaveBeenCalled()
  })

  it('stops handled keys from reaching the document', () => {
    // The global j/k bindings live on document; if they saw these events the
    // list selection would move underneath the open menu.
    const seen = vi.fn()
    document.addEventListener('keydown', seen)
    const menu = renderMenu({ scripts: [makeScript()] }).menu!
    for (const key of ['j', 'k', 'Escape', 'Enter', 'ArrowDown']) {
      fireEvent.keyDown(menu, { key })
    }
    document.removeEventListener('keydown', seen)
    expect(seen).not.toHaveBeenCalled()
  })

  it('lets unhandled keys through', () => {
    const seen = vi.fn()
    document.addEventListener('keydown', seen)
    fireEvent.keyDown(renderMenu().menu!, { key: 'q' })
    document.removeEventListener('keydown', seen)
    expect(seen).toHaveBeenCalled()
  })

  it('runs an item on click', () => {
    const { onRun } = renderMenu({ scripts: [makeScript()] })
    fireEvent.click(screen.getByRole('menuitem', { name: /Open Jira issue/ }))
    expect(onRun).toHaveBeenCalledWith('jira.sh')
  })

  it('closes when clicking outside', () => {
    const { onClose } = renderMenu()
    fireEvent.mouseDown(document.body)
    expect(onClose).toHaveBeenCalled()
  })

  it('keeps the menu inside the viewport near the bottom-right corner', () => {
    renderMenu({ anchor: { x: 1190, y: 790 } })
    const menu = screen.getByRole('menu')
    expect(Number.parseFloat(menu.style.left)).toBeLessThan(1190)
    expect(Number.parseFloat(menu.style.top)).toBeLessThan(790)
  })

  it('labels itself with the bean it acts on', () => {
    renderMenu()
    expect(screen.getByRole('menu')).toHaveAccessibleName('Actions for Fix the thing')
  })
})
