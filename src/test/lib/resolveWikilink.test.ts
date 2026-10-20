import { describe, it, expect } from 'vitest'
import {
  buildBeanIndex,
  resolveWikilink,
  wikilinkTitle,
  MISSING_LABEL,
} from '../../lib/resolveWikilink'
import { buildPrefixMap, EMPTY_PREFIX_MAP } from '../../lib/prefixMap'
import { flattenBeans } from '../../lib/beanTree'
import type { Bean, ProjectPrefix } from '../../types/beans'

function bean(id: string, overrides: Partial<Bean> = {}): Bean {
  return {
    id,
    title: `Bean ${id}`,
    status: 'todo',
    bean_type: 'task',
    parent: null,
    tags: [],
    priority: null,
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

const tree = [
  bean('beanstalk-msdy', {
    children: [bean('beanstalk-4ad6'), bean('beanstalk-e3za', { children: [bean('beanstalk-deep')] })],
  }),
]
const index = buildBeanIndex(tree)
const prefixMap = buildPrefixMap([pp('beanstalk', 'beanstalk-'), pp('hivelens', 'hivelens-')])
const ctx = { index, prefixMap, activeProjectPath: '/src/beanstalk' }

describe('buildBeanIndex (beanstalk-4ad6)', () => {
  it('indexes nested beans at every depth', () => {
    expect(index.size).toBe(4)
    expect(index.get('beanstalk-deep')?.id).toBe('beanstalk-deep')
  })

  it('shares the extracted tree flattener', () => {
    expect(flattenBeans(tree).map((b) => b.id)).toEqual([
      'beanstalk-msdy',
      'beanstalk-4ad6',
      'beanstalk-e3za',
      'beanstalk-deep',
    ])
  })
})

describe('resolveWikilink (beanstalk-4ad6)', () => {
  it('resolves a local id', () => {
    const got = resolveWikilink('beanstalk-4ad6', ctx)
    expect(got).toEqual({ kind: 'local', bean: index.get('beanstalk-4ad6') })
  })

  it('resolves a local id case-insensitively, prefix included', () => {
    const got = resolveWikilink('BEANSTALK-4AD6', ctx)
    expect(got.kind).toBe('local')
  })

  it('resolves an id from another configured project as foreign', () => {
    expect(resolveWikilink('hivelens-7k2p', ctx)).toEqual({
      kind: 'foreign',
      projectPath: '/src/hivelens',
      projectName: 'hivelens',
      id: 'hivelens-7k2p',
    })
  })

  it('resolves a foreign id case-insensitively', () => {
    const got = resolveWikilink('Hivelens-7K2P', ctx)
    expect(got).toMatchObject({ kind: 'foreign', projectName: 'hivelens', id: 'hivelens-7k2p' })
  })

  it('reports an id belonging to no configured project as missing', () => {
    expect(resolveWikilink('nowhere-1234', ctx)).toEqual({ kind: 'missing' })
  })

  it('reports an unloaded id in the active project as missing, not foreign to itself', () => {
    // `beanstalk-gone` matches the ACTIVE project's prefix but is absent from the
    // loaded tree — which is exactly what an archived bean looks like, since the
    // scanner prunes `.beans/archive`. Calling that `foreign` would offer to
    // switch to the project already open and then find nothing.
    expect(resolveWikilink('beanstalk-gone', ctx)).toEqual({ kind: 'missing' })
  })

  it('still reports foreign when no project is active', () => {
    // With no project open the index cannot be authoritative for anything, so a
    // prefix match is the best information available.
    expect(resolveWikilink('beanstalk-gone', { ...ctx, activeProjectPath: null })).toMatchObject({
      kind: 'foreign',
      projectName: 'beanstalk',
    })
  })

  it('refuses a prefix that two projects both claim, rather than guessing', () => {
    const colliding = buildPrefixMap([pp('one', 'shared-'), pp('two', 'shared-')])
    expect(resolveWikilink('shared-abcd', { ...ctx, prefixMap: colliding })).toEqual({ kind: 'missing' })
  })

  it('still resolves the active project’s own beans when its prefix collides', () => {
    const colliding = buildPrefixMap([pp('beanstalk', 'beanstalk-'), pp('other', 'beanstalk-')])
    expect(resolveWikilink('beanstalk-4ad6', { ...ctx, prefixMap: colliding }).kind).toBe('local')
  })

  it('reports missing against an empty bean set', () => {
    expect(resolveWikilink('beanstalk-4ad6', { index: buildBeanIndex([]), prefixMap: EMPTY_PREFIX_MAP, activeProjectPath: null })).toEqual({
      kind: 'missing',
    })
  })

  it('reports missing for an empty or whitespace target', () => {
    expect(resolveWikilink('', ctx)).toEqual({ kind: 'missing' })
    expect(resolveWikilink('   ', ctx)).toEqual({ kind: 'missing' })
  })

  it('trims a padded target', () => {
    expect(resolveWikilink('  beanstalk-4ad6  ', ctx).kind).toBe('local')
  })
})

describe('wikilinkTitle (beanstalk-4ad6)', () => {
  it('names the bean for a local target', () => {
    expect(wikilinkTitle(resolveWikilink('beanstalk-4ad6', ctx))).toBe('Go to beanstalk-4ad6')
  })

  it('names the owning project for a foreign target', () => {
    expect(wikilinkTitle(resolveWikilink('hivelens-7k2p', ctx))).toBe(
      'Go to hivelens-7k2p in hivelens'
    )
  })

  it('says missing or archived, never unknown', () => {
    const title = wikilinkTitle({ kind: 'missing' })
    expect(title).toBe(`This bean is ${MISSING_LABEL}`)
    expect(title).toContain('archived')
    expect(title).not.toMatch(/unknown/i)
  })
})
