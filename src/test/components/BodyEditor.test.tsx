import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { BodyEditor } from '../../components/BodyEditor'
import type { Bean, ProjectPrefix } from '../../types/beans'

const mockInvoke = vi.mocked(invoke)

function makeBean(overrides: Partial<Bean> = {}): Bean {
  return {
    id: 'beanstalk-4ad6',
    title: 'Resolve a wikilink target',
    status: 'todo',
    bean_type: 'task',
    parent: null,
    tags: [],
    priority: null,
    created_at: null,
    updated_at: null,
    body: '',
    file_path: '/src/beanstalk/.beans/beanstalk-4ad6.md',
    children: [],
    blocking: [],
    blocked_by: [],
    ...overrides,
  }
}

const beans = [
  makeBean(),
  makeBean({ id: 'beanstalk-e3za', title: 'remark plugin for wikilinks' }),
]
const hivelens: ProjectPrefix = { path: '/src/hivelens', name: 'hivelens', prefix: 'hivelens-' }

/** A controlled harness, since the picker only works against live value+caret. */
function Harness({ otherProjects }: { otherProjects?: ProjectPrefix[] }) {
  const [value, setValue] = useState('')
  return (
    <>
      <BodyEditor
        value={value}
        onChange={setValue}
        beans={beans}
        otherProjects={otherProjects}
        placeholder="body"
      />
      <output data-testid="value">{value}</output>
    </>
  )
}

function type(text: string) {
  const area = screen.getByPlaceholderText('body') as HTMLTextAreaElement
  fireEvent.change(area, { target: { value: text, selectionStart: text.length } })
  return area
}

const currentValue = () => screen.getByTestId('value').textContent

describe('BodyEditor [[ autocomplete (beanstalk-xc3j)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue([])
  })

  it('shows no picker until [[ is typed', () => {
    render(<Harness />)
    type('just prose')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('opens the picker on [[ and lists local beans', () => {
    render(<Harness />)
    type('See [[')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('Resolve a wikilink target')).toBeInTheDocument()
  })

  it('filters as the user types, including on spaces in a title', () => {
    render(<Harness />)
    type('See [[remark plugin')
    expect(screen.getByText('remark plugin for wikilinks')).toBeInTheDocument()
    expect(screen.queryByText('Resolve a wikilink target')).not.toBeInTheDocument()
  })

  it('inserts a well-formed link when a result is clicked', () => {
    render(<Harness />)
    type('See [[resolv')
    fireEvent.click(screen.getByText('Resolve a wikilink target'))
    expect(currentValue()).toBe('See [[beanstalk-4ad6]]')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('inserts with Enter on the highlighted result', () => {
    render(<Harness />)
    const area = type('See [[')
    fireEvent.keyDown(area, { key: 'Enter' })
    expect(currentValue()).toBe('See [[beanstalk-4ad6]]')
  })

  it('moves the highlight with the arrow keys', () => {
    render(<Harness />)
    const area = type('See [[')
    fireEvent.keyDown(area, { key: 'ArrowDown' })
    fireEvent.keyDown(area, { key: 'Enter' })
    expect(currentValue()).toBe('See [[beanstalk-e3za]]')
  })

  it('wraps the highlight around with ArrowUp from the first row', () => {
    render(<Harness />)
    const area = type('See [[')
    fireEvent.keyDown(area, { key: 'ArrowUp' })
    fireEvent.keyDown(area, { key: 'Enter' })
    expect(currentValue()).toBe('See [[beanstalk-e3za]]')
  })

  it('inserts with Tab as well as Enter', () => {
    render(<Harness />)
    const area = type('See [[')
    fireEvent.keyDown(area, { key: 'Tab' })
    expect(currentValue()).toBe('See [[beanstalk-4ad6]]')
  })

  it('Escape closes the picker and leaves the literal text alone', () => {
    render(<Harness />)
    const area = type('See [[resolv')
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    fireEvent.keyDown(area, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(currentValue()).toBe('See [[resolv')
  })

  it('stays dismissed while the caret remains in the same run', () => {
    render(<Harness />)
    const area = type('See [[re')
    fireEvent.keyDown(area, { key: 'Escape' })
    type('See [[reso')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('reopens for a new [[ after one was dismissed', () => {
    render(<Harness />)
    const area = type('See [[re')
    fireEvent.keyDown(area, { key: 'Escape' })
    type('See [[re]] and [[')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('closes once the link is completed by hand', () => {
    render(<Harness />)
    type('See [[beanstalk-4ad6]]')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('offers beans from other projects once a search is typed', async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'get_beans') return [makeBean({ id: 'hivelens-7k2p', title: 'UTM provider bug' })]
      return []
    })
    render(<Harness otherProjects={[hivelens]} />)
    type('See [[UTM')

    await waitFor(() => expect(screen.getByText('UTM provider bug')).toBeInTheDocument())
    expect(screen.getByText('hivelens')).toBeInTheDocument()
  })

  it('inserts a foreign id unqualified', async () => {
    mockInvoke.mockImplementation(async (cmd: string) => {
      if (cmd === 'get_beans') return [makeBean({ id: 'hivelens-7k2p', title: 'UTM provider bug' })]
      return []
    })
    render(<Harness otherProjects={[hivelens]} />)
    type('See [[UTM')
    await waitFor(() => expect(screen.getByText('UTM provider bug')).toBeInTheDocument())

    fireEvent.click(screen.getByText('UTM provider bug'))
    expect(currentValue()).toBe('See [[hivelens-7k2p]]')
  })

  it('reads no other project before a search is typed', () => {
    render(<Harness otherProjects={[hivelens]} />)
    type('See [[')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('leaves arrow keys to the textarea when the picker is closed', () => {
    render(<Harness />)
    const area = type('plain prose')
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true })
    area.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })

  it('shows no results for a query that matches nothing', () => {
    render(<Harness />)
    type('See [[zzzzz')
    expect(screen.getByText('No results')).toBeInTheDocument()
  })
})
