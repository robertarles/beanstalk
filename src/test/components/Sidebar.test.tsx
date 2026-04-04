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
  statusFilter: [] as string[],
  onStatusFilter: vi.fn(),
  tagFilter: [] as string[],
  onTagFilter: vi.fn(),
  tags: [] as string[],
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

    expect(screen.getByText('todo')).toBeInTheDocument()
    expect(screen.getByText('in-progress')).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()
  })

  it('shows All button when filters are active', () => {
    render(<Sidebar {...defaultProps} statusFilter={['todo']} />)
    expect(screen.getByText('All')).toBeInTheDocument()
  })

  // ── Tag filter section ────────────────────────────────────────────────────

  it('hides Tags section when no tags exist', () => {
    render(<Sidebar {...defaultProps} tags={[]} />)
    expect(screen.queryByText('Tags')).not.toBeInTheDocument()
  })

  it('shows Tags section when tags exist', () => {
    render(<Sidebar {...defaultProps} tags={['bug', 'frontend']} />)
    expect(screen.getByText(/^Tags$/i)).toBeInTheDocument()
    expect(screen.getByText('#bug')).toBeInTheDocument()
    expect(screen.getByText('#frontend')).toBeInTheDocument()
  })

  it('shows All button in Tags section when tag filter is active', () => {
    render(<Sidebar {...defaultProps} tags={['bug', 'frontend']} tagFilter={['bug']} />)
    expect(screen.getByText('All')).toBeInTheDocument()
  })

  it('calls onTagFilter with added tag when inactive tag is clicked', async () => {
    const onTagFilter = vi.fn()
    const user = userEvent.setup()
    render(<Sidebar {...defaultProps} tags={['bug', 'frontend']} tagFilter={[]} onTagFilter={onTagFilter} />)
    await user.click(screen.getByText('#bug'))
    expect(onTagFilter).toHaveBeenCalledWith(['bug'])
  })

  it('calls onTagFilter with tag removed when active tag is clicked', async () => {
    const onTagFilter = vi.fn()
    const user = userEvent.setup()
    render(<Sidebar {...defaultProps} tags={['bug', 'frontend']} tagFilter={['bug']} onTagFilter={onTagFilter} />)
    await user.click(screen.getByText('#bug'))
    expect(onTagFilter).toHaveBeenCalledWith([])
  })

  it('calls onTagFilter with empty array when All is clicked', async () => {
    const onTagFilter = vi.fn()
    const user = userEvent.setup()
    render(<Sidebar {...defaultProps} tags={['bug']} tagFilter={['bug']} onTagFilter={onTagFilter} />)
    await user.click(screen.getByText('All'))
    expect(onTagFilter).toHaveBeenCalledWith([])
  })
})
