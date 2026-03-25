import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BeanDetail } from '../../components/BeanDetail'
import type { Bean } from '../../types/beans'

// openBeanInEditor is imported in BeanDetail via ../lib/tauri which calls invoke
// Since invoke is already mocked globally in setup.ts, this will be a no-op

const mockBean: Bean = {
  id: 'bean-abc',
  title: 'My Test Bean',
  status: 'open',
  bean_type: 'task',
  parent: null,
  tags: ['bug', 'frontend'],
  assignee: 'alice',
  created_at: '2024-03-01T00:00:00Z',
  updated_at: '2024-03-15T00:00:00Z',
  body: 'This is the bean body.',
  file_path: '/project/.beans/bean-abc.md',
  children: [],
}

const defaultProps = {
  bean: mockBean,
  onOpenInEditor: vi.fn(),
  onStatusChange: vi.fn(),
  availableStatuses: ['open', 'in-progress', 'done', 'archived'],
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
    const statusSelect = screen.getByRole('combobox')
    expect(statusSelect).toHaveValue('open')
  })

  it('status select calls onStatusChange', () => {
    const onStatusChange = vi.fn()
    render(<BeanDetail {...defaultProps} onStatusChange={onStatusChange} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'done' } })
    expect(onStatusChange).toHaveBeenCalledWith('done')
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

  it('save button calls onSave with updated fields', () => {
    const onSave = vi.fn()
    render(<BeanDetail {...defaultProps} onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))

    // Update the title field
    const titleInput = screen.getByPlaceholderText('Bean title')
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } })

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Updated Title' })
    )
    // Returns to view mode
    expect(screen.queryByText('Editing Bean')).not.toBeInTheDocument()
  })

  it('open in editor button is present', () => {
    render(<BeanDetail {...defaultProps} />)
    const openButtons = screen.getAllByRole('button', { name: /Open in Editor/i })
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

    // Change status to 'done'.
    fireEvent.change(statusSelect!, { target: { value: 'done' } })

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'done' })
    )
  })

  it('save preserves original status when status is not changed', () => {
    const onSave = vi.fn()
    render(<BeanDetail {...defaultProps} onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /^Edit$/i }))

    // Change only the title, leave status untouched.
    const titleInput = screen.getByPlaceholderText('Bean title')
    fireEvent.change(titleInput, { target: { value: 'New Title' } })

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Title',
        status: mockBean.status, // original status preserved
      })
    )
  })
})
