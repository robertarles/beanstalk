import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BeanDetail } from '../../components/BeanDetail'
import type { Bean } from '../../types/beans'
import { openUrl as mockOpenUrl } from '@tauri-apps/plugin-opener'

// openBeanInEditor is imported in BeanDetail via ../lib/tauri which calls invoke
// Since invoke is already mocked globally in setup.ts, this will be a no-op

const mockBean: Bean = {
  id: 'bean-abc',
  title: 'My Test Bean',
  status: 'open',
  bean_type: 'task',
  parent: null,
  tags: ['bug', 'frontend'],
  priority: null,
  assignee: 'alice',
  created_at: '2024-03-01T00:00:00Z',
  updated_at: '2024-03-15T00:00:00Z',
  body: 'This is the bean body.',
  file_path: '/project/.beans/bean-abc.md',
  children: [],
  blocking: [],
  blocked_by: [],
}

const defaultProps = {
  bean: mockBean,
  onOpenInEditor: vi.fn(),
  onStatusChange: vi.fn(),
  availableStatuses: ['open', 'in-progress', 'completed', 'scrapped'],
  onSave: vi.fn(),
  projectPath: '/project',
}

describe('BeanDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when bean=null', () => {
    render(<BeanDetail {...defaultProps} bean={null} />)
    expect(screen.getByText('Select a bean to view details')).toBeInTheDocument()
  })

  it('renders bean title and status', () => {
    render(<BeanDetail {...defaultProps} />)
    expect(screen.getByText('My Test Bean')).toBeInTheDocument()
    // Status appears in the select element
    const statusSelect = screen.getByRole('combobox', { name: 'Status' })
    expect(statusSelect).toHaveValue('open')
  })

  it('status select calls onStatusChange', () => {
    const onStatusChange = vi.fn()
    render(<BeanDetail {...defaultProps} onStatusChange={onStatusChange} />)
    const select = screen.getByRole('combobox', { name: 'Status' })
    fireEvent.change(select, { target: { value: 'completed' } })
    expect(onStatusChange).toHaveBeenCalledWith('completed')
  })

  // ── beanstalk-3mto: terminal statuses always offered in status select ─────
  it('status select always offers canonical statuses even when absent from availableStatuses', () => {
    // Simulate archived beans being excluded: only 'todo' is present in the tree.
    render(
      <BeanDetail
        {...defaultProps}
        bean={{ ...mockBean, status: 'todo' }}
        availableStatuses={['todo']}
      />
    )
    const select = screen.getByRole('combobox', { name: 'Status' })
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value)
    expect(options).toEqual(
      expect.arrayContaining(['todo', 'in-progress', 'completed', 'scrapped', 'draft'])
    )
  })

  it('status select preserves custom project statuses alongside canonical ones', () => {
    render(
      <BeanDetail
        {...defaultProps}
        bean={{ ...mockBean, status: 'open' }}
        availableStatuses={['open', 'todo']}
      />
    )
    const select = screen.getByRole('combobox', { name: 'Status' })
    const options = Array.from(select.querySelectorAll('option')).map((o) => o.value)
    // Canonical + the custom 'open' status (also the current bean status)
    expect(options).toEqual(
      expect.arrayContaining(['todo', 'in-progress', 'completed', 'scrapped', 'draft', 'open'])
    )
  })

  it('edit button switches to edit mode', () => {
    render(<BeanDetail {...defaultProps} />)
    const editButton = screen.getByRole('button', { name: /^Edit$/i })
    fireEvent.click(editButton)
    // Edit mode renders "Editing Bean" heading
    expect(screen.getByText('Editing Bean')).toBeInTheDocument()
  })

  it('cancel button exits edit mode without saving', () => {
    const onSave = vi.fn()
    render(<BeanDetail {...defaultProps} onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
    expect(screen.getByText('Editing Bean')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }))
    // Back to view mode, title is visible again
    expect(screen.getByText('My Test Bean')).toBeInTheDocument()
    expect(screen.queryByText('Editing Bean')).not.toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('save button calls onSave with updated fields', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<BeanDetail {...defaultProps} onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))

    // Update the title field
    const titleInput = screen.getByPlaceholderText('Bean title')
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))
    })
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Updated Title' })
    )
    // Returns to view mode
    expect(screen.queryByText('Editing Bean')).not.toBeInTheDocument()
  })

  it('open in editor button is present', () => {
    render(<BeanDetail {...defaultProps} />)
    const openButtons = screen.getAllByRole('button', { name: /Edit ↗/i })
    expect(openButtons.length).toBeGreaterThan(0)
  })

  // ── beanstalk-e5ce: status saved from edit form ───────────────────────────

  it('save calls onSave with the current status (status field included)', () => {
    const onSave = vi.fn()
    render(<BeanDetail {...defaultProps} onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))

    // The status select in edit mode should show the bean's current status.
    const statusSelects = screen.getAllByRole('combobox')
    // In edit mode there is one combobox for status (and possibly one for parent).
    const statusSelect = statusSelects.find(
      (s) => (s as HTMLSelectElement).value === mockBean.status
    )
    expect(statusSelect).toBeDefined()

    // Change status to 'completed'.
    fireEvent.change(statusSelect!, { target: { value: 'completed' } })

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed' })
    )
  })

  it('sends only the changed field, leaving the rest to be kept from disk (beanstalk-c57u)', () => {
    const onSave = vi.fn()
    render(<BeanDetail {...defaultProps} onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))

    // Change only the title, leave status untouched.
    const titleInput = screen.getByPlaceholderText('Bean title')
    fireEvent.change(titleInput, { target: { value: 'New Title' } })

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    // An unchanged field is omitted rather than restated from a possibly stale
    // copy -- restating is how a status change came to blank a title
    // (beanstalk-e5ce). Omitted means the backend keeps what is on disk.
    expect(onSave).toHaveBeenCalledWith({ title: 'New Title' })
  })

  it('writes nothing when the form is saved unchanged (beanstalk-c57u)', () => {
    const onSave = vi.fn()
    render(<BeanDetail {...defaultProps} onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    // Touch is the deliberate way to bump updated_at; Save must not do it.
    expect(onSave).not.toHaveBeenCalled()
  })

  // ── Link rendering ──────────────────────────────────────────────────────────

  it('renders plain body text without clickable links', () => {
    render(<BeanDetail {...defaultProps} />)
    expect(screen.getByText('This is the bean body.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /http/i })).not.toBeInTheDocument()
  })

  it('renders a markdown link as a clickable span', () => {
    const beanWithLink: Bean = { ...mockBean, body: 'See [docs](https://example.com) here' }
    render(<BeanDetail {...defaultProps} bean={beanWithLink} />)
    const link = screen.getByText('docs')
    expect(link.tagName).toBe('SPAN')
    expect(link.className).toContain('cursor-pointer')
  })

  it('clicking a link calls openUrl with the correct URL', () => {
    const beanWithLink: Bean = { ...mockBean, body: '[click me](https://example.com)' }
    render(<BeanDetail {...defaultProps} bean={beanWithLink} />)
    fireEvent.click(screen.getByText('click me'))
    expect(mockOpenUrl).toHaveBeenCalledWith('https://example.com')
  })

  it('renders multiple links as separate clickable spans', () => {
    const beanWithLinks: Bean = {
      ...mockBean,
      body: '[a](https://a.com) and [b](https://b.com)',
    }
    render(<BeanDetail {...defaultProps} bean={beanWithLinks} />)
    expect(screen.getByText('a').className).toContain('cursor-pointer')
    expect(screen.getByText('b').className).toContain('cursor-pointer')
  })

  it('does not render non-HTTP scheme links as clickable', () => {
    const beanWithBadLink: Bean = { ...mockBean, body: '[bad](javascript:xss)' }
    render(<BeanDetail {...defaultProps} bean={beanWithBadLink} />)
    // The entire link text should be rendered as plain text, not a clickable span
    const el = screen.getByText('bad')
    expect(el.className).not.toContain('cursor-pointer')
  })
})

// ── Markdown rendering smoke tests ─────────────────────────────────────────

describe('BeanDetail markdown rendering', () => {
  it('renders h2 heading', () => {
    const bean = { ...mockBean, body: '## My Heading' }
    render(<BeanDetail {...defaultProps} bean={bean} />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    expect(screen.getByText('My Heading')).toBeInTheDocument()
  })

  it('renders bold text', () => {
    const bean = { ...mockBean, body: '**bold text**' }
    const { container } = render(<BeanDetail {...defaultProps} bean={bean} />)
    expect(container.querySelector('strong')).toBeInTheDocument()
  })

  it('renders italic text', () => {
    const bean = { ...mockBean, body: '*italic text*' }
    const { container } = render(<BeanDetail {...defaultProps} bean={bean} />)
    expect(container.querySelector('em')).toBeInTheDocument()
  })

  it('renders inline code with pill styling', () => {
    const bean = { ...mockBean, body: 'use `npm install` to install' }
    const { container } = render(<BeanDetail {...defaultProps} bean={bean} />)
    const code = container.querySelector('code')
    expect(code).toBeInTheDocument()
    expect(code!.className).toContain('bg-gray-100')
  })

  it('renders fenced code block with dark background', () => {
    const bean = { ...mockBean, body: '```\nconsole.log("hello")\n```' }
    const { container } = render(<BeanDetail {...defaultProps} bean={bean} />)
    const pre = container.querySelector('pre')
    expect(pre).toBeInTheDocument()
    expect(pre!.className).toContain('bg-gray-900')
  })

  it('renders unordered list', () => {
    const bean = { ...mockBean, body: '- item one\n- item two' }
    render(<BeanDetail {...defaultProps} bean={bean} />)
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(2)
  })

  it('renders ordered list', () => {
    const bean = { ...mockBean, body: '1. first\n2. second' }
    const { container } = render(<BeanDetail {...defaultProps} bean={bean} />)
    expect(container.querySelector('ol')).toBeInTheDocument()
  })

  it('renders blockquote', () => {
    const bean = { ...mockBean, body: '> a quote' }
    const { container } = render(<BeanDetail {...defaultProps} bean={bean} />)
    expect(container.querySelector('blockquote')).toBeInTheDocument()
  })

  it('renders horizontal rule', () => {
    const bean = { ...mockBean, body: 'above\n\n---\n\nbelow' }
    const { container } = render(<BeanDetail {...defaultProps} bean={bean} />)
    expect(container.querySelector('hr')).toBeInTheDocument()
  })

  it('renders GFM table', () => {
    const bean = { ...mockBean, body: '| A | B |\n|---|---|\n| 1 | 2 |' }
    const { container } = render(<BeanDetail {...defaultProps} bean={bean} />)
    expect(container.querySelector('table')).toBeInTheDocument()
    expect(container.querySelector('th')).toBeInTheDocument()
    expect(container.querySelector('td')).toBeInTheDocument()
  })

  it('renders GFM task list checkboxes', () => {
    const bean = { ...mockBean, body: '- [ ] todo\n- [x] done' }
    const { container } = render(<BeanDetail {...defaultProps} bean={bean} />)
    const checkboxes = container.querySelectorAll('input[type="checkbox"]')
    expect(checkboxes.length).toBe(2)
  })

  it('renders GFM strikethrough', () => {
    const bean = { ...mockBean, body: '~~strikethrough~~' }
    const { container } = render(<BeanDetail {...defaultProps} bean={bean} />)
    expect(container.querySelector('del')).toBeInTheDocument()
  })

  it('renders mixed content without errors', () => {
    const body = `# Title\n\nSome **bold** and *italic* text.\n\n- item 1\n- item 2\n\n\`\`\`\ncode block\n\`\`\`\n\nSee [docs](https://example.com) for more.`
    const bean = { ...mockBean, body }
    render(<BeanDetail {...defaultProps} bean={bean} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument()
    expect(screen.getByText('docs')).toBeInTheDocument()
  })
})

describe('BeanDetail relation badges (beanstalk-3wh2)', () => {
  const related: Bean = {
    ...mockBean,
    blocking: ['bean-blk1', 'bean-blk2'],
    blocked_by: ['bean-dep1'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders every Blocking and Blocked By id as a button when onSelectBean is given', () => {
    render(<BeanDetail {...defaultProps} bean={related} onSelectBean={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'bean-blk1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'bean-blk2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'bean-dep1' })).toBeInTheDocument()
  })

  it('selects the clicked relation, including ones past the first', () => {
    const onSelectBean = vi.fn()
    render(<BeanDetail {...defaultProps} bean={related} onSelectBean={onSelectBean} />)

    fireEvent.click(screen.getByRole('button', { name: 'bean-blk2' }))
    expect(onSelectBean).toHaveBeenCalledWith('bean-blk2')

    fireEvent.click(screen.getByRole('button', { name: 'bean-dep1' }))
    expect(onSelectBean).toHaveBeenCalledWith('bean-dep1')
  })

  it('is keyboard reachable', () => {
    const onSelectBean = vi.fn()
    render(<BeanDetail {...defaultProps} bean={related} onSelectBean={onSelectBean} />)
    const badge = screen.getByRole('button', { name: 'bean-blk1' })
    badge.focus()
    expect(badge).toHaveFocus()
  })

  it('stays inert text when no onSelectBean is provided', () => {
    render(<BeanDetail {...defaultProps} bean={related} />)
    expect(screen.queryByRole('button', { name: 'bean-blk1' })).not.toBeInTheDocument()
    expect(screen.getByText('bean-blk1')).toBeInTheDocument()
  })
})

describe('BeanDetail write gating (beanstalk-dg1m)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('disables Edit and Touch when the beans CLI is missing', () => {
    render(
      <BeanDetail {...defaultProps} onTouch={vi.fn()} beansAvailable={false} beansError="`beans` not found on PATH" />
    )
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Touch' })).toBeDisabled()
  })

  it('explains why, on the disabled control', () => {
    render(<BeanDetail {...defaultProps} beansAvailable={false} beansError="`beans` not found on PATH" />)
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveAttribute(
      'title',
      '`beans` not found on PATH'
    )
  })

  it('falls back to a general explanation when no reason is given', () => {
    render(<BeanDetail {...defaultProps} beansAvailable={false} />)
    const title = screen.getByRole('button', { name: 'Edit' }).getAttribute('title') ?? ''
    expect(title).toContain('beans')
    expect(title).toContain('external editor')
  })

  it('leaves the external editor button enabled — it writes nothing through Beanstalk', () => {
    render(<BeanDetail {...defaultProps} beansAvailable={false} />)
    // The pane must never be a dead end: this is the escape hatch.
    expect(screen.getByRole('button', { name: /Edit ↗/ })).toBeEnabled()
  })

  it('leaves everything enabled when the CLI is present', () => {
    render(<BeanDetail {...defaultProps} onTouch={vi.fn()} beansAvailable={true} />)
    expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Touch' })).toBeEnabled()
  })
})

describe('BeanDetail conflict handling (beanstalk-ep8j)', () => {
  beforeEach(() => vi.clearAllMocks())

  const bodyBean: Bean = { ...mockBean, body: 'Base body.' }

  it('sends the base body alongside a body change', async () => {
    const onSave = vi.fn()
    render(<BeanDetail {...defaultProps} bean={bodyBean} onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
    fireEvent.change(screen.getByPlaceholderText('Bean title'), { target: { value: 'T2' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Save$/i })) })

    // A title-only change carries no base: the body is not being replaced.
    expect(onSave).toHaveBeenCalledWith({ title: 'T2' })
  })

  it('keeps the typed text and explains when the save is refused', async () => {
    const onSave = vi.fn().mockRejectedValue({ code: 'CONFLICT', message: 'It changed on disk.' })
    render(<BeanDetail {...defaultProps} bean={bodyBean} onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
    const titleInput = screen.getByPlaceholderText('Bean title')
    fireEvent.change(titleInput, { target: { value: 'My careful edit' } })

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Save$/i })) })

    expect(screen.getByRole('alert')).toHaveTextContent('It changed on disk.')
    // The hard requirement: edit mode stays open and the text survives.
    expect(screen.getByPlaceholderText('Bean title')).toHaveValue('My careful edit')
  })

  it('stays in edit mode on any other failure too, so nothing is lost', async () => {
    const onSave = vi.fn().mockRejectedValue({ code: 'BEANS_FAILED', message: 'disk full' })
    render(<BeanDetail {...defaultProps} bean={bodyBean} onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
    fireEvent.change(screen.getByPlaceholderText('Bean title'), { target: { value: 'Draft' } })

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Save$/i })) })

    expect(screen.getByPlaceholderText('Bean title')).toHaveValue('Draft')
    // Only a conflict gets the inline explanation; others are toasted by App.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('warns when the bean changes on disk mid-edit', () => {
    const { rerender } = render(<BeanDetail {...defaultProps} bean={bodyBean} onSave={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    // Same bean id, new body: the watcher reloaded it underneath the editor.
    rerender(<BeanDetail {...defaultProps} bean={{ ...bodyBean, body: 'Appended by an agent.' }} onSave={vi.fn()} />)
    expect(screen.getByRole('status')).toHaveTextContent(/changed on disk/i)
  })

  it('closes cleanly on a successful save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<BeanDetail {...defaultProps} bean={bodyBean} onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
    fireEvent.change(screen.getByPlaceholderText('Bean title'), { target: { value: 'Fine' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Save$/i })) })

    expect(screen.queryByPlaceholderText('Bean title')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('BeanDetail inline body editor (beanstalk-crjm)', () => {
  const bodyBean: Bean = { ...mockBean, body: 'Original body.' }
  const allBeans: Bean[] = [bodyBean, { ...mockBean, id: 'bean-target', title: 'Target Bean' }]

  beforeEach(() => vi.clearAllMocks())

  function openEditor(props: Record<string, unknown> = {}) {
    render(<BeanDetail {...defaultProps} bean={bodyBean} allBeans={allBeans} onSave={vi.fn()} {...props} />)
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))
    return screen.getByPlaceholderText(/Markdown body/) as HTMLTextAreaElement
  }

  it('offers the body for editing, preloaded with the current value', () => {
    expect(openEditor()).toHaveValue('Original body.')
  })

  it('keeps the external editor button available beside it', () => {
    openEditor()
    // Deliberately not replaced by the inline editor.
    expect(screen.getByRole('button', { name: /Editor ↗/ })).toBeEnabled()
  })

  it('sends the body and its base when it is changed', async () => {
    const onSave = vi.fn()
    const area = openEditor({ onSave })
    fireEvent.change(area, { target: { value: 'Rewritten body.' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Save$/i })) })

    expect(onSave).toHaveBeenCalledWith({
      body: 'Rewritten body.',
      expectBody: 'Original body.',
    })
  })

  it('does not send the body when only other fields changed', async () => {
    const onSave = vi.fn()
    openEditor({ onSave })
    fireEvent.change(screen.getByPlaceholderText('Bean title'), { target: { value: 'New' } })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Save$/i })) })

    expect(onSave).toHaveBeenCalledWith({ title: 'New' })
  })

  it('offers the wikilink picker on [[ inside the body', () => {
    const area = openEditor()
    fireEvent.change(area, { target: { value: 'See [[Target', selectionStart: 12 } })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('Target Bean')).toBeInTheDocument()
  })

  it('confirms before discarding a modified body', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const area = openEditor()
    fireEvent.change(area, { target: { value: 'Work in progress.' } })

    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }))

    expect(confirmSpy).toHaveBeenCalled()
    // Declining keeps the draft and stays in edit mode.
    expect(screen.getByPlaceholderText(/Markdown body/)).toHaveValue('Work in progress.')
    confirmSpy.mockRestore()
  })

  it('cancels without asking when nothing was changed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    openEditor()
    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }))

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(screen.queryByPlaceholderText(/Markdown body/)).not.toBeInTheDocument()
    confirmSpy.mockRestore()
  })
})
