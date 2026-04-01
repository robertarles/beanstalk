import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { CreateBeanForm } from '../../components/CreateBeanForm'
import type { Bean } from '../../types/beans'

const mockInvoke = vi.mocked(invoke)

const mockCreatedBean: Bean = {
  id: 'new-bean-123',
  title: 'My New Bean',
  status: 'open',
  bean_type: 'task',
  parent: null,
  tags: [],
  priority: null,
  assignee: null,
  created_at: '2024-03-01T00:00:00Z',
  updated_at: null,
  body: '',
  file_path: '/project/.beans/new-bean-123.md',
  children: [],
}

const defaultProps = {
  projectPath: '/project',
  allBeans: [],
  onCreated: vi.fn(),
  onCancel: vi.fn(),
}

describe('CreateBeanForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all form fields', () => {
    render(<CreateBeanForm {...defaultProps} />)
    expect(screen.getByPlaceholderText('Bean title')).toBeInTheDocument()
    // Status label
    expect(screen.getByText(/Status/i)).toBeInTheDocument()
    // Type label
    expect(screen.getByText(/Type/i)).toBeInTheDocument()
    // Tags label
    expect(screen.getByText(/Tags/i)).toBeInTheDocument()
    // Assignee label
    expect(screen.getByText(/Assignee/i)).toBeInTheDocument()
    // Description / body textarea
    expect(screen.getByPlaceholderText('Optional description...')).toBeInTheDocument()
  })

  it('shows validation error when title is empty on submit', async () => {
    render(<CreateBeanForm {...defaultProps} />)
    // Title is empty by default; click Create Bean
    fireEvent.click(screen.getByRole('button', { name: /Create Bean/i }))
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
    })
    expect(defaultProps.onCreated).not.toHaveBeenCalled()
  })

  it('cancel button calls onCancel', () => {
    const onCancel = vi.fn()
    render(<CreateBeanForm {...defaultProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('escape key calls onCancel', () => {
    const onCancel = vi.fn()
    render(<CreateBeanForm {...defaultProps} onCancel={onCancel} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onCancel).toHaveBeenCalled()
  })

  it('submits form with correct fields', async () => {
    mockInvoke.mockResolvedValueOnce(mockCreatedBean)
    const onCreated = vi.fn()
    render(<CreateBeanForm {...defaultProps} onCreated={onCreated} />)

    // Fill in the title
    fireEvent.change(screen.getByPlaceholderText('Bean title'), {
      target: { value: 'My New Bean' },
    })

    // Submit via button
    fireEvent.click(screen.getByRole('button', { name: /Create Bean/i }))

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith(mockCreatedBean)
    })

    expect(mockInvoke).toHaveBeenCalledWith(
      'create_bean',
      expect.objectContaining({
        projectPath: '/project',
        title: 'My New Bean',
        status: expect.any(String), // beanstalk-6p3a: status must always be sent
      })
    )
  })

  // ── beanstalk-6p3a: status forwarded to create_bean ──────────────────────

  it('sends the default status to create_bean (status is not omitted)', async () => {
    // Regression: create_bean requires status; omitting it caused a Tauri error.
    mockInvoke.mockResolvedValueOnce(mockCreatedBean)
    const onCreated = vi.fn()
    render(
      <CreateBeanForm
        {...defaultProps}
        onCreated={onCreated}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Bean title'), {
      target: { value: 'Status Test Bean' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Create Bean/i }))

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        'create_bean',
        expect.objectContaining({
          title: 'Status Test Bean',
          // status must be present and be a non-empty string
          status: expect.stringMatching(/\w+/),
        })
      )
    })
  })
})
