import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddProjectDialog } from '../../components/AddProjectDialog'

describe('AddProjectDialog', () => {
  it('renders path input', () => {
    render(
      <AddProjectDialog
        onAdd={vi.fn(() => Promise.resolve())}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/Project directory path/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('/path/to/project')).toBeInTheDocument()
  })

  it('shows error when submitting empty path', async () => {
    const user = userEvent.setup()

    render(
      <AddProjectDialog
        onAdd={vi.fn(() => Promise.resolve())}
        onClose={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: /Add/i }))

    expect(screen.getByText(/Path must not be empty/i)).toBeInTheDocument()
  })

  it('cancel button calls onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <AddProjectDialog
        onAdd={vi.fn(() => Promise.resolve())}
        onClose={onClose}
      />
    )

    await user.click(screen.getByRole('button', { name: /Cancel/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
