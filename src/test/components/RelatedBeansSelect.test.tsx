import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { invoke } from '@tauri-apps/api/core'
import { RelatedBeansSelect } from '../../components/RelatedBeansSelect'
import type { Bean, ProjectPrefix } from '../../types/beans'

const mockInvoke = vi.mocked(invoke)

function makeBean(overrides: Partial<Bean> = {}): Bean {
  return {
    id: 'beanstalk-001',
    title: 'Test Bean',
    status: 'todo',
    bean_type: 'task',
    parent: null,
    tags: [],
    priority: null,
    assignee: null,
    created_at: null,
    updated_at: null,
    body: '',
    file_path: '/src/beanstalk/.beans/beanstalk-001.md',
    children: [],
    blocking: [],
    blocked_by: [],
    ...overrides,
  }
}

const local = [
  makeBean({ id: 'beanstalk-001', title: 'Alpha Bean' }),
  makeBean({ id: 'beanstalk-002', title: 'Beta Bean' }),
]

const hivelens: ProjectPrefix = { path: '/src/hivelens', name: 'hivelens', prefix: 'hivelens-' }

/** `get_beans` for hivelens returns one bean whose title also matches "Bean". */
function mockHivelens() {
  mockInvoke.mockImplementation(async (cmd: string) => {
    if (cmd === 'get_beans') return [makeBean({ id: 'hivelens-7k2p', title: 'Gamma Bean' })]
    return []
  })
}

function openPicker() {
  fireEvent.click(screen.getByRole('button', { name: /Add bean/ }))
}

function search(text: string) {
  fireEvent.change(screen.getByPlaceholderText(/Search/), { target: { value: text } })
}

describe('RelatedBeansSelect cross-project (beanstalk-h71l)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue([])
  })

  it('offers only local beans before any search, without reading other projects', () => {
    render(
      <RelatedBeansSelect beans={local} value={[]} onChange={vi.fn()} otherProjects={[hivelens]} />
    )
    openPicker()
    expect(screen.getByText('Alpha Bean')).toBeInTheDocument()
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('loads and offers beans from other projects once the user searches', async () => {
    mockHivelens()
    render(
      <RelatedBeansSelect beans={local} value={[]} onChange={vi.fn()} otherProjects={[hivelens]} />
    )
    openPicker()
    search('Bean')

    await waitFor(() => expect(screen.getByText('Gamma Bean')).toBeInTheDocument())
    expect(mockInvoke).toHaveBeenCalledWith('get_beans', { projectPath: '/src/hivelens' })
    expect(screen.getByText('Alpha Bean')).toBeInTheDocument()
  })

  it('shows the owning project on a foreign result', async () => {
    mockHivelens()
    render(
      <RelatedBeansSelect beans={local} value={[]} onChange={vi.fn()} otherProjects={[hivelens]} />
    )
    openPicker()
    search('Gamma')

    await waitFor(() => expect(screen.getByText('Gamma Bean')).toBeInTheDocument())
    expect(screen.getByText('hivelens')).toBeInTheDocument()
    // A local result carries no project badge.
    search('Alpha')
    await waitFor(() => expect(screen.getByText('Alpha Bean')).toBeInTheDocument())
  })

  it('selects a foreign bean by id', async () => {
    mockHivelens()
    const onChange = vi.fn()
    render(
      <RelatedBeansSelect beans={local} value={[]} onChange={onChange} otherProjects={[hivelens]} />
    )
    openPicker()
    search('Gamma')
    await waitFor(() => expect(screen.getByText('Gamma Bean')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Gamma Bean'))
    expect(onChange).toHaveBeenCalledWith(['hivelens-7k2p'])
  })

  it('matches a foreign bean by id as well as by title', async () => {
    mockHivelens()
    render(
      <RelatedBeansSelect beans={local} value={[]} onChange={vi.fn()} otherProjects={[hivelens]} />
    )
    openPicker()
    search('hivelens-7k2p')
    await waitFor(() => expect(screen.getByText('Gamma Bean')).toBeInTheDocument())
  })

  it('keeps the chip for a selected id it cannot resolve yet', () => {
    // A cross-project relation read back from frontmatter before that project's
    // beans are loaded. Dropping the chip would hide a relation still set.
    render(
      <RelatedBeansSelect
        beans={local}
        value={['hivelens-7k2p']}
        onChange={vi.fn()}
        otherProjects={[hivelens]}
      />
    )
    expect(screen.getByTitle('Remove hivelens-7k2p')).toBeInTheDocument()
  })

  it('does not refetch a project when the picker is reopened', async () => {
    mockHivelens()
    render(
      <RelatedBeansSelect beans={local} value={[]} onChange={vi.fn()} otherProjects={[hivelens]} />
    )
    openPicker()
    search('Bean')
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledTimes(1))

    fireEvent.keyDown(screen.getByPlaceholderText(/Search/), { key: 'Escape' })
    openPicker()
    search('Bean')
    await waitFor(() => expect(screen.getByText('Gamma Bean')).toBeInTheDocument())
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it('still lists local beans when another project cannot be read', async () => {
    mockInvoke.mockRejectedValue(new Error('unreadable project'))
    render(
      <RelatedBeansSelect beans={local} value={[]} onChange={vi.fn()} otherProjects={[hivelens]} />
    )
    openPicker()
    search('Bean')
    await waitFor(() => expect(screen.getByText('Alpha Bean')).toBeInTheDocument())
    expect(screen.getByText('Beta Bean')).toBeInTheDocument()
  })

  it('behaves exactly as before when no other projects are supplied', async () => {
    render(<RelatedBeansSelect beans={local} value={[]} onChange={vi.fn()} />)
    openPicker()
    expect(screen.getByPlaceholderText('Search beans...')).toBeInTheDocument()
    search('Bean')
    await waitFor(() => expect(screen.getByText('Alpha Bean')).toBeInTheDocument())
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('advertises cross-project search in the placeholder when it is available', () => {
    render(
      <RelatedBeansSelect beans={local} value={[]} onChange={vi.fn()} otherProjects={[hivelens]} />
    )
    openPicker()
    expect(screen.getByPlaceholderText('Search all projects...')).toBeInTheDocument()
  })

  it('keeps excludeId, removal and Escape working', () => {
    const onChange = vi.fn()
    render(
      <RelatedBeansSelect
        beans={local}
        value={['beanstalk-002']}
        onChange={onChange}
        excludeId="beanstalk-001"
        otherProjects={[hivelens]}
      />
    )
    openPicker()
    // Excluded and already-selected beans are not offered.
    expect(screen.queryByText('Alpha Bean')).not.toBeInTheDocument()

    fireEvent.keyDown(screen.getByPlaceholderText(/Search/), { key: 'Escape' })
    expect(screen.queryByPlaceholderText(/Search/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByTitle('Remove beanstalk-002'))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
