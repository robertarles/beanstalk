import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ParentBeanSelect } from '../../components/ParentBeanSelect'
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
    blocking: [],
    blocked_by: [],
    ...overrides,
  }
}

const beanA = makeBean({ id: 'bean-001', title: 'Alpha Bean', file_path: '/project/.beans/bean-001.md' })
const beanB = makeBean({ id: 'bean-002', title: 'Beta Bean', file_path: '/project/.beans/bean-002.md' })
const beanC = makeBean({ id: 'bean-003', title: 'Gamma Bean', file_path: '/project/.beans/bean-003.md' })

const beans = [beanA, beanB, beanC]

function open() {
  // The trigger button shows the current selection or "None".
  fireEvent.click(screen.getByRole('button', { name: /none/i }))
  return screen.getByPlaceholderText('Search beans...')
}

describe('ParentBeanSelect keyboard navigation', () => {
  it('selects the highlighted bean with ArrowDown + Enter', () => {
    const onChange = vi.fn()
    render(<ParentBeanSelect beans={beans} value={null} onChange={onChange} />)
    const input = open()

    // Option list (no search): [None, Alpha, Beta, Gamma]. ArrowDown once -> Alpha.
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith('bean-001')
  })

  it('navigates further down and wraps to the last item boundary', () => {
    const onChange = vi.fn()
    render(<ParentBeanSelect beans={beans} value={null} onChange={onChange} />)
    const input = open()

    // Move past the end; index should clamp to the last option (Gamma).
    for (let i = 0; i < 10; i++) fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith('bean-003')
  })

  it('selects None (null) when Enter pressed at the top of the list', () => {
    const onChange = vi.fn()
    render(<ParentBeanSelect beans={beans} value="bean-002" onChange={onChange} />)
    // Trigger shows the selected bean's title now.
    fireEvent.click(screen.getByRole('button', { name: /beta bean/i }))
    const input = screen.getByPlaceholderText('Search beans...')

    // activeIndex starts at 0 which is the "None" option.
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('navigates a search-filtered list', () => {
    const onChange = vi.fn()
    render(<ParentBeanSelect beans={beans} value={null} onChange={onChange} />)
    const input = open()

    fireEvent.change(input, { target: { value: 'Beta' } })
    // Filtered list has no "None" option; index 0 is the first match.
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith('bean-002')
  })

  it('closes the dropdown on Escape', () => {
    const onChange = vi.fn()
    render(<ParentBeanSelect beans={beans} value={null} onChange={onChange} />)
    const input = open()

    fireEvent.keyDown(input, { key: 'Escape' })

    expect(screen.queryByPlaceholderText('Search beans...')).not.toBeInTheDocument()
  })
})
