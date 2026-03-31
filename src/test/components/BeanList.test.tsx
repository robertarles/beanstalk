import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BeanList } from '../../components/BeanList'
import type { Bean } from '../../types/beans'

function makeBean(overrides: Partial<Bean> = {}): Bean {
  return {
    id: 'bean-001',
    title: 'Test Bean',
    status: 'open',
    bean_type: 'task',
    parent: null,
    tags: [],
    priority: null,
    assignee: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: null,
    body: '',
    file_path: '/project/.beans/bean-001.md',
    children: [],
    ...overrides,
  }
}

const beanA = makeBean({ id: 'bean-001', title: 'Alpha Bean', status: 'open', file_path: '/project/.beans/bean-001.md' })
const beanB = makeBean({ id: 'bean-002', title: 'Beta Bean', status: 'completed', file_path: '/project/.beans/bean-002.md' })
const beanC = makeBean({ id: 'bean-003', title: 'Gamma Bean', status: 'open', file_path: '/project/.beans/bean-003.md' })

const defaultProps = {
  beans: [beanA, beanB, beanC],
  selectedId: null,
  onSelect: vi.fn(),
  loading: false,
}

describe('BeanList', () => {
  it('renders loading skeleton when loading=true', () => {
    const { container } = render(
      <BeanList {...defaultProps} loading={true} beans={[]} />
    )
    // Skeleton has animate-pulse elements
    const pulseEls = container.querySelectorAll('.animate-pulse')
    expect(pulseEls.length).toBeGreaterThan(0)
    // No actual bean rows
    expect(screen.queryByText('Alpha Bean')).not.toBeInTheDocument()
  })

  it('renders empty state when beans=[] and loading=false', () => {
    render(<BeanList {...defaultProps} beans={[]} loading={false} />)
    expect(screen.getByText('No beans found')).toBeInTheDocument()
  })

  it('renders bean rows', () => {
    render(<BeanList {...defaultProps} />)
    expect(screen.getByText('Alpha Bean')).toBeInTheDocument()
    expect(screen.getByText('Beta Bean')).toBeInTheDocument()
    expect(screen.getByText('Gamma Bean')).toBeInTheDocument()
  })

  it('calls onSelect when row clicked', () => {
    const onSelect = vi.fn()
    render(<BeanList {...defaultProps} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Alpha Bean'))
    expect(onSelect).toHaveBeenCalledWith('bean-001')
  })

  it('filters by statusFilter prop', () => {
    render(<BeanList {...defaultProps} statusFilter={['completed']} />)
    expect(screen.queryByText('Alpha Bean')).not.toBeInTheDocument()
    expect(screen.getByText('Beta Bean')).toBeInTheDocument()
    expect(screen.queryByText('Gamma Bean')).not.toBeInTheDocument()
  })

  it('search filters beans by title', async () => {
    render(<BeanList {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText('Search beans...')
    fireEvent.change(searchInput, { target: { value: 'Alpha' } })
    // Wait for debounce
    await waitFor(() => {
      expect(screen.getByText('Alpha Bean')).toBeInTheDocument()
      expect(screen.queryByText('Beta Bean')).not.toBeInTheDocument()
      expect(screen.queryByText('Gamma Bean')).not.toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('sortable columns: click Title header changes sort', () => {
    render(<BeanList {...defaultProps} />)
    const titleHeader = screen.getByRole('button', { name: /Title/i })
    // Initially sorted by date desc; click title to sort by title asc
    fireEvent.click(titleHeader)
    // The sort arrow should now show ascending indicator (↑)
    expect(titleHeader.textContent).toContain('↑')
    // Click again to reverse
    fireEvent.click(titleHeader)
    expect(titleHeader.textContent).toContain('↓')
  })

  it('expandable children: bean with children shows chevron, click expands', () => {
    const child = makeBean({
      id: 'bean-child',
      title: 'Child Bean',
      file_path: '/project/.beans/bean-child.md',
      parent: 'bean-001',
    })
    const parentBean = makeBean({
      id: 'bean-001',
      title: 'Parent Bean',
      file_path: '/project/.beans/bean-001.md',
      children: [child],
    })
    render(<BeanList {...defaultProps} beans={[parentBean]} />)

    // Child should not be visible yet
    expect(screen.queryByText('Child Bean')).not.toBeInTheDocument()

    // The chevron ▶ indicates the parent has children
    const chevrons = screen.getAllByText('▶', { exact: false })
    expect(chevrons.length).toBeGreaterThan(0)

    // Click the chevron span to expand
    fireEvent.click(chevrons[0])

    // Child should now be visible
    expect(screen.getByText('Child Bean')).toBeInTheDocument()
  })
})
