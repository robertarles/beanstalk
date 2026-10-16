import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BeanDetail } from '../../components/BeanDetail'
import { buildPrefixMap } from '../../lib/prefixMap'
import type { Bean, ProjectPrefix } from '../../types/beans'
import { openUrl as mockOpenUrl } from '@tauri-apps/plugin-opener'
import { invoke } from '@tauri-apps/api/core'
import { resetForeignBeanCache } from '../../lib/foreignBeanCache'

const mockInvoke = vi.mocked(invoke)

function bean(id: string, overrides: Partial<Bean> = {}): Bean {
  return {
    id,
    title: `Bean ${id}`,
    status: 'todo',
    bean_type: 'task',
    parent: null,
    tags: [],
    priority: null,
    assignee: null,
    created_at: null,
    updated_at: null,
    body: '',
    file_path: `/src/beanstalk/.beans/${id}.md`,
    children: [],
    blocking: [],
    blocked_by: [],
    ...overrides,
  }
}

const pp = (name: string, prefix: string): ProjectPrefix => ({ path: `/src/${name}`, name, prefix })
const prefixMap = buildPrefixMap([pp('beanstalk', 'beanstalk-'), pp('hivelens', 'hivelens-')])

const allBeans = [bean('beanstalk-msdy'), bean('beanstalk-4ad6')]

function renderBody(body: string, onSelectBean = vi.fn()) {
  render(
    <BeanDetail
      bean={bean('beanstalk-msdy', { body })}
      onOpenInEditor={vi.fn()}
      onStatusChange={vi.fn()}
      availableStatuses={['todo']}
      allBeans={allBeans}
      projectPath="/src/beanstalk"
      prefixMap={prefixMap}
      onSelectBean={onSelectBean}
    />
  )
  return onSelectBean
}

describe('BeanDetail wikilinks (beanstalk-adx8)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetForeignBeanCache()
  })

  it('renders a local link as a button and selects that bean', async () => {
    const onSelectBean = renderBody('See [[beanstalk-4ad6]] for the resolver.')
    const link = screen.getByRole('button', { name: 'beanstalk-4ad6' })
    expect(link).toHaveAttribute('title', 'Go to beanstalk-4ad6')
    link.click()
    expect(onSelectBean).toHaveBeenCalledWith('beanstalk-4ad6')
  })

  it('renders a foreign link and selects it with its project path', () => {
    const onSelectBean = renderBody('Same cause as [[hivelens-7k2p]].')
    const link = screen.getByRole('button', { name: /hivelens-7k2p/ })
    expect(link).toHaveAttribute('title', 'Go to hivelens-7k2p in hivelens')
    link.click()
    expect(onSelectBean).toHaveBeenCalledWith('hivelens-7k2p', '/src/hivelens')
  })

  it('renders an unresolvable link as inert text reading missing or archived', () => {
    const onSelectBean = renderBody('Superseded by [[nowhere-1234]].')
    expect(screen.queryByRole('button', { name: 'nowhere-1234' })).not.toBeInTheDocument()
    const inert = screen.getByText('nowhere-1234')
    expect(inert).toHaveAttribute('title', 'This bean is missing or archived')
    expect(inert.getAttribute('title')).not.toMatch(/unknown/i)
    expect(onSelectBean).not.toHaveBeenCalled()
  })

  it('treats an archived bean in the active project as missing, not as a live link', () => {
    // Matches the active project's prefix but is absent from the loaded tree,
    // which is exactly what `.beans/archive` being pruned looks like.
    renderBody('Superseded by [[beanstalk-gone]].')
    expect(screen.queryByRole('button', { name: /beanstalk-gone/ })).not.toBeInTheDocument()
    expect(screen.getByText('beanstalk-gone')).toHaveAttribute(
      'title',
      'This bean is missing or archived'
    )
  })

  it('leaves a wikilink inside a code fence untouched', () => {
    renderBody('```\n[[beanstalk-4ad6]]\n```')
    expect(screen.queryByRole('button', { name: 'beanstalk-4ad6' })).not.toBeInTheDocument()
    expect(screen.getByText('[[beanstalk-4ad6]]')).toBeInTheDocument()
  })

  it('leaves a wikilink in inline code untouched — the escape hatch', () => {
    renderBody('Write `[[beanstalk-4ad6]]` literally.')
    expect(screen.queryByRole('button', { name: 'beanstalk-4ad6' })).not.toBeInTheDocument()
    expect(screen.getByText('[[beanstalk-4ad6]]')).toBeInTheDocument()
  })

  it('renders the alias instead of the id', () => {
    const onSelectBean = renderBody('See [[beanstalk-4ad6|the resolver task]].')
    const link = screen.getByRole('button', { name: 'the resolver task' })
    link.click()
    expect(onSelectBean).toHaveBeenCalledWith('beanstalk-4ad6')
  })

  it('renders local, foreign and missing links in one body', () => {
    renderBody('Local [[beanstalk-4ad6]], foreign [[hivelens-7k2p]], gone [[nowhere-1234]].')
    expect(screen.getByRole('button', { name: 'beanstalk-4ad6' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hivelens-7k2p/ })).toBeInTheDocument()
    expect(screen.getByText('nowhere-1234')).toBeInTheDocument()
  })

  it('never opens the system browser for a wikilink', () => {
    renderBody('See [[beanstalk-4ad6]].')
    screen.getByRole('button', { name: 'beanstalk-4ad6' }).click()
    expect(mockOpenUrl).not.toHaveBeenCalled()
  })

  it('is keyboard reachable', () => {
    renderBody('See [[beanstalk-4ad6]].')
    const link = screen.getByRole('button', { name: 'beanstalk-4ad6' })
    // Focus flips the foreign-preview probe, so it is a state update.
    act(() => link.focus())
    expect(link).toHaveFocus()
  })

  it('renders links as inert when the pane has no way to navigate', () => {
    render(
      <BeanDetail
        bean={bean('beanstalk-msdy', { body: 'See [[beanstalk-4ad6]].' })}
        onOpenInEditor={vi.fn()}
        onStatusChange={vi.fn()}
        availableStatuses={['todo']}
        allBeans={allBeans}
        projectPath="/src/beanstalk"
        prefixMap={prefixMap}
      />
    )
    expect(screen.queryByRole('button', { name: 'beanstalk-4ad6' })).not.toBeInTheDocument()
    expect(screen.getByText('beanstalk-4ad6')).toBeInTheDocument()
  })

  it('renders every link as missing when no prefix map has loaded yet', () => {
    render(
      <BeanDetail
        bean={bean('beanstalk-msdy', { body: 'See [[hivelens-7k2p]].' })}
        onOpenInEditor={vi.fn()}
        onStatusChange={vi.fn()}
        availableStatuses={['todo']}
        allBeans={allBeans}
        projectPath="/src/beanstalk"
        onSelectBean={vi.fn()}
      />
    )
    expect(screen.getByText('hivelens-7k2p')).toHaveAttribute(
      'title',
      'This bean is missing or archived'
    )
  })

  it('still renders ordinary external links through openUrl', () => {
    renderBody('See [docs](https://example.com).')
    screen.getByText('docs').click()
    expect(mockOpenUrl).toHaveBeenCalledWith('https://example.com')
  })
})

describe('BeanDetail foreign link preview (beanstalk-kstx)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetForeignBeanCache()
    mockInvoke.mockResolvedValue({ id: 'hivelens-7k2p', title: 'UTM provider drops the campaign' })
  })

  it('fires no lookup for foreign links on render', () => {
    renderBody('A [[hivelens-7k2p]] and B [[hivelens-aaaa]] and C [[hivelens-bbbb]].')
    expect(mockInvoke).not.toHaveBeenCalled()
  })

  it('shows the foreign title on hover, without switching projects', async () => {
    const onSelectBean = renderBody('Same cause as [[hivelens-7k2p]].')
    const link = screen.getByRole('button', { name: /hivelens-7k2p/ })

    fireEvent.mouseEnter(link)
    await waitFor(() =>
      expect(link).toHaveAttribute(
        'title',
        'Go to hivelens-7k2p in hivelens — UTM provider drops the campaign'
      )
    )
    expect(onSelectBean).not.toHaveBeenCalled()
  })

  it('probes on keyboard focus too', async () => {
    renderBody('Same cause as [[hivelens-7k2p]].')
    fireEvent.focus(screen.getByRole('button', { name: /hivelens-7k2p/ }))
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith('get_bean', {
      projectPath: '/src/hivelens',
      beanId: 'hivelens-7k2p',
    }))
  })

  it('marks a foreign bean that no longer exists as dead before it is clicked', async () => {
    mockInvoke.mockRejectedValue('Bean not found: hivelens-gone')
    renderBody('Superseded by [[hivelens-gone]].')

    fireEvent.mouseEnter(screen.getByRole('button', { name: /hivelens-gone/ }))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /hivelens-gone/ })).not.toBeInTheDocument()
    )
    expect(screen.getByText('hivelens-gone')).toHaveAttribute(
      'title',
      'This bean is missing or archived'
    )
  })

  it('keeps a link usable when the project cannot be read', async () => {
    mockInvoke.mockRejectedValue(new Error('Permission denied'))
    const onSelectBean = renderBody('Same cause as [[hivelens-7k2p]].')
    const link = screen.getByRole('button', { name: /hivelens-7k2p/ })

    fireEvent.mouseEnter(link)
    await waitFor(() => expect(mockInvoke).toHaveBeenCalled())

    // Still a live cross-project link: a project we failed to open is not a claim
    // that the bean is gone.
    expect(screen.getByRole('button', { name: /hivelens-7k2p/ })).toHaveAttribute(
      'title',
      'Go to hivelens-7k2p in hivelens'
    )
    screen.getByRole('button', { name: /hivelens-7k2p/ }).click()
    expect(onSelectBean).toHaveBeenCalledWith('hivelens-7k2p', '/src/hivelens')
  })

  it('makes one lookup for repeat hovers of the same bean', async () => {
    renderBody('First [[hivelens-7k2p]] and again [[hivelens-7k2p]].')
    const links = screen.getAllByRole('button', { name: /hivelens-7k2p/ })

    fireEvent.mouseEnter(links[0])
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledTimes(1))
    fireEvent.mouseEnter(links[1])
    fireEvent.mouseEnter(links[0])
    await waitFor(() =>
      expect(links[1]).toHaveAttribute(
        'title',
        'Go to hivelens-7k2p in hivelens — UTM provider drops the campaign'
      )
    )
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it('never probes a local link', async () => {
    renderBody('See [[beanstalk-4ad6]].')
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'beanstalk-4ad6' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'beanstalk-4ad6' })).toBeInTheDocument())
    expect(mockInvoke).not.toHaveBeenCalled()
  })
})
