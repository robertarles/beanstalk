import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BeanList, collectTags, filterByTags } from '../../components/BeanList'
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

// ── collectTags ─────────────────────────────────────────────────────────────

describe('collectTags', () => {
  it('returns empty array for beans with no tags', () => {
    const beans = [makeBean({ tags: [] }), makeBean({ id: 'bean-002', tags: [] })]
    expect(collectTags(beans)).toEqual([])
  })

  it('collects and deduplicates tags across beans', () => {
    const beans = [
      makeBean({ tags: ['bug', 'frontend'] }),
      makeBean({ id: 'bean-002', tags: ['bug', 'backend'] }),
    ]
    expect(collectTags(beans)).toEqual(['backend', 'bug', 'frontend'])
  })

  it('collects tags from nested children', () => {
    const child = makeBean({ id: 'child-001', tags: ['nested'] })
    const parent = makeBean({ tags: ['top'], children: [child] })
    expect(collectTags([parent])).toEqual(['nested', 'top'])
  })
})

// ── filterByTags ─────────────────────────────────────────────────────────────

describe('filterByTags', () => {
  it('returns all beans when filter is empty', () => {
    const beans = [makeBean({ tags: ['bug'] }), makeBean({ id: 'bean-002', tags: [] })]
    expect(filterByTags(beans, [])).toHaveLength(2)
  })

  it('filters to beans matching a single tag', () => {
    const beans = [
      makeBean({ id: 'bean-001', tags: ['bug'] }),
      makeBean({ id: 'bean-002', tags: ['feature'] }),
    ]
    expect(filterByTags(beans, ['bug'])).toHaveLength(1)
    expect(filterByTags(beans, ['bug'])[0].id).toBe('bean-001')
  })

  it('applies AND logic — bean must have all active tags', () => {
    const beans = [
      makeBean({ id: 'bean-001', tags: ['bug', 'frontend'] }),
      makeBean({ id: 'bean-002', tags: ['bug'] }),
    ]
    const result = filterByTags(beans, ['bug', 'frontend'])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('bean-001')
  })

  it('keeps parent when child matches filter', () => {
    const child = makeBean({ id: 'child-001', tags: ['bug'], file_path: '/project/.beans/child-001.md' })
    const parent = makeBean({ id: 'parent-001', tags: [], children: [child], file_path: '/project/.beans/parent-001.md' })
    const result = filterByTags([parent], ['bug'])
    expect(result).toHaveLength(1)
    expect(result[0].children).toHaveLength(1)
  })

  it('excludes beans with no matching tags', () => {
    const beans = [makeBean({ tags: ['frontend'] })]
    expect(filterByTags(beans, ['bug'])).toHaveLength(0)
  })
})
