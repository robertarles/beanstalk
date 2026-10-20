import { describe, it, expect } from 'vitest'
import { fromMarkdown } from 'mdast-util-from-markdown'
import type { Root } from 'mdast'
import { remarkWikilink, type Wikilink } from '../../lib/remarkWikilink'
import { buildBeanIndex, resolveWikilink, wikilinkTitle } from '../../lib/resolveWikilink'
import { buildPrefixMap } from '../../lib/prefixMap'
import type { Bean, ProjectPrefix } from '../../types/beans'

/**
 * Every `[[...]]` form the README documents, asserted to behave as documented.
 *
 * The README is the contract users read; if a row of its table stops being true,
 * this fails rather than the docs quietly going stale.
 */

function bean(id: string, title = `Bean ${id}`): Bean {
  return {
    id,
    title,
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
  }
}

const pp = (name: string, prefix: string): ProjectPrefix => ({ path: `/src/${name}`, name, prefix })

const ctx = {
  index: buildBeanIndex([bean('beanstalk-4ad6', 'Resolve a wikilink target')]),
  prefixMap: buildPrefixMap([pp('beanstalk', 'beanstalk-'), pp('hivelens', 'hivelens-')]),
  activeProjectPath: '/src/beanstalk',
}

/** Parse one body and return its wikilink nodes. */
function parse(src: string): Wikilink[] {
  const tree = fromMarkdown(src) as Root
  remarkWikilink()(tree)
  const out: Wikilink[] = []
  const walk = (n: { type: string; children?: unknown[] }) => {
    if (n.type === 'wikilink') out.push(n as unknown as Wikilink)
    for (const c of (n.children ?? []) as { type: string; children?: unknown[] }[]) walk(c)
  }
  walk(tree as unknown as { type: string; children?: unknown[] })
  return out
}

describe('README [[...]] examples (beanstalk-781y)', () => {
  it('links a local id', () => {
    const [link] = parse('Same root cause as [[beanstalk-4ad6]].')
    expect(resolveWikilink(link.target, ctx).kind).toBe('local')
  })

  it('links a foreign id with an alias, as in the opening example', () => {
    const [link] = parse('Superseded by [[hivelens-7k2p|the UTM provider fix]].')
    expect(link.display).toBe('the UTM provider fix')
    expect(resolveWikilink(link.target, ctx)).toMatchObject({
      kind: 'foreign',
      projectName: 'hivelens',
    })
  })

  describe('the documented table of forms', () => {
    it('`[[beanstalk-4ad6]]` renders the id, linked', () => {
      const [link] = parse('[[beanstalk-4ad6]]')
      expect(link.display).toBeNull()
      expect(resolveWikilink(link.target, ctx).kind).toBe('local')
    })

    it('`[[beanstalk-4ad6|label]]` renders the label, linked', () => {
      const [link] = parse('[[beanstalk-4ad6|label]]')
      expect(link.display).toBe('label')
      expect(resolveWikilink(link.target, ctx).kind).toBe('local')
    })

    it('`[[BEANSTALK-4AD6]]` is the same link — matching is case-insensitive', () => {
      const [link] = parse('[[BEANSTALK-4AD6]]')
      expect(resolveWikilink(link.target, ctx).kind).toBe('local')
    })

    it('`[[ beanstalk-4ad6 ]]` is the same link — whitespace is trimmed', () => {
      const [link] = parse('[[ beanstalk-4ad6 ]]')
      expect(link.target).toBe('beanstalk-4ad6')
      expect(resolveWikilink(link.target, ctx).kind).toBe('local')
    })
  })

  it('splits only on the first pipe, so a label may contain more', () => {
    const [link] = parse('[[beanstalk-4ad6|a|b|c]]')
    expect(link.display).toBe('a|b|c')
  })

  it('falls back to the id for an empty label', () => {
    const [link] = parse('[[beanstalk-4ad6|]]')
    expect(link.display).toBeNull()
  })

  it('cannot resolve a project that was never added, so it reads as missing', () => {
    const [link] = parse('[[nowhere-1234]]')
    expect(resolveWikilink(link.target, ctx).kind).toBe('missing')
  })

  it('says "missing or archived" on hover, not "unknown"', () => {
    const [link] = parse('[[nowhere-1234]]')
    const title = wikilinkTitle(resolveWikilink(link.target, ctx))
    expect(title).toContain('missing or archived')
    expect(title).not.toMatch(/unknown/i)
  })

  it('refuses an ambiguous prefix rather than guessing, as the known issue states', () => {
    const colliding = buildPrefixMap([pp('one', 'shared-'), pp('two', 'shared-')])
    const [link] = parse('[[shared-abcd]]')
    expect(resolveWikilink(link.target, { ...ctx, prefixMap: colliding }).kind).toBe('missing')
  })

  it('shows the brackets literally in inline code', () => {
    expect(parse('Write `[[like this]]` to show the brackets literally.')).toEqual([])
  })

  it('leaves fenced code blocks alone', () => {
    expect(parse('```\n[[beanstalk-4ad6]]\n```')).toEqual([])
  })

  it('confirms backslashes do NOT work, exactly as the README warns', () => {
    expect(parse(String.raw`\[\[x\]\]`)).toHaveLength(1)
  })
})
