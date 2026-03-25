import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '../../components/Sidebar'
import type { Project } from '../../types/beans'

const sampleProjects: Project[] = [
  { path: '/path/to/alpha', name: 'Alpha Project' },
  { path: '/path/to/beta', name: 'Beta Project' },
]

const defaultProps = {
  projects: sampleProjects,
  activeProject: null,
  onSelectProject: vi.fn(),
  onAddProject: vi.fn(() => Promise.resolve()),
  onRemoveProject: vi.fn(),
  statusFilter: null,
  onStatusFilter: vi.fn(),
  statuses: ['todo', 'in-progress', 'done'],
}

describe('Sidebar', () => {
  it('renders project list', () => {
    render(<Sidebar {...defaultProps} />)

    expect(screen.getByText('Alpha Project')).toBeInTheDocument()
    expect(screen.getByText('Beta Project')).toBeInTheDocument()
  })

  it('highlights active project', () => {
    render(<Sidebar {...defaultProps} activeProject="/path/to/alpha" />)

    const alphaButton = screen.getByTitle('/path/to/alpha')
    expect(alphaButton.className).toContain('bg-blue-100')

    const betaButton = screen.getByTitle('/path/to/beta')
    expect(betaButton.className).not.toContain('bg-blue-100')
  })

  it('clicking project calls onSelectProject', async () => {
    const onSelectProject = vi.fn()
    const user = userEvent.setup()

    render(<Sidebar {...defaultProps} onSelectProject={onSelectProject} />)

    await user.click(screen.getByTitle('/path/to/alpha'))

    expect(onSelectProject).toHaveBeenCalledWith('/path/to/alpha')
  })

  it('shows empty state when no projects', () => {
    render(<Sidebar {...defaultProps} projects={[]} />)

    expect(screen.getByText(/No projects yet/i)).toBeInTheDocument()
  })

  it('shows status filter options', () => {
    render(<Sidebar {...defaultProps} />)

    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('todo')).toBeInTheDocument()
    expect(screen.getByText('in-progress')).toBeInTheDocument()
    expect(screen.getByText('done')).toBeInTheDocument()
  })
})
