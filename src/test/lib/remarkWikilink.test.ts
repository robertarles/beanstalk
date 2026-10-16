import { describe, it, expect } from 'vitest'
import { fromMarkdown } from 'mdast-util-from-markdown'
import type { Root } from 'mdast'
import { remarkWikilink, type Wikilink } from '../../lib/remarkWikilink'

/** Parse, run the plugin, and collect the flattened node stream of every paragraph. */
function run(src: string): Root {
  const tree = fromMarkdown(src) as Root
  remarkWikilink()(tree)
  return tree
}

function links(src: string): Wikilink[] {
  const found: Wikilink[] = []
  const walk = (node: { type: string; children?: unknown[] }) => {
    if (node.type === 'wikilink') found.push(node as unknown as Wikilink)
    for (const c of (node.children ?? []) as { type: string; children?: unknown[] }[]) walk(c)
  }
  walk(run(src) as unknown as { type: string; children?: unknown[] })
  return found
}

/** The concatenated `value` of every text node, to prove what was left alone. */
function texts(src: string): string[] {
  const found: string[] = []
  const walk = (node: { type: string; value?: string; children?: unknown[] }) => {
    if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') {
      found.push(node.value ?? '')
    }
    for (const c of (node.children ?? []) as { type: string; value?: string; children?: unknown[] }[]) walk(c)
  }
  walk(run(src) as unknown as { type: string; value?: string; children?: unknown[] })
  return found
}

describe('remarkWikilink (beanstalk-e3za)', () => {
  it('parses a bare link', () => {
    const [link] = links('See [[beanstalk-msdy]] for details.')
    expect(link.target).toBe('beanstalk-msdy')
    expect(link.display).toBeNull()
    expect(link.data.hName).toBe('wikilink')
    expect(link.data.hProperties).toEqual({ target: 'beanstalk-msdy' })
  })

  it('keeps the surrounding text intact', () => {
    expect(texts('See [[beanstalk-msdy]] for details.')).toEqual(['See ', ' for details.'])
  })

  it('parses the alias form and splits on the first pipe only', () => {
    const [link] = links('[[beanstalk-msdy|the wikilink milestone|v2]]')
    expect(link.target).toBe('beanstalk-msdy')
    expect(link.display).toBe('the wikilink milestone|v2')
    expect(link.data.hProperties.display).toBe('the wikilink milestone|v2')
  })

  it('trims whitespace around both parts', () => {
    const [link] = links('[[  beanstalk-msdy  |  see this  ]]')
    expect(link.target).toBe('beanstalk-msdy')
    expect(link.display).toBe('see this')
  })

  it('falls back to the id when the alias is empty', () => {
    const [link] = links('[[beanstalk-msdy|]]')
    expect(link.display).toBeNull()
  })

  it('parses adjacent links as two nodes', () => {
    const found = links('[[bean-aaaa]][[bean-bbbb]]')
    expect(found.map((l) => l.target)).toEqual(['bean-aaaa', 'bean-bbbb'])
  })

  it('parses several links in one paragraph', () => {
    const found = links('One [[bean-aaaa]], two [[bean-bbbb]], three [[bean-cccc]].')
    expect(found).toHaveLength(3)
  })

  it('leaves a fenced code block untouched', () => {
    expect(links('```\n[[bean-aaaa]]\n```')).toEqual([])
    expect(texts('```\n[[bean-aaaa]]\n```')).toEqual(['[[bean-aaaa]]'])
  })

  it('leaves inline code untouched — this is the escape hatch', () => {
    expect(links('Write `[[bean-aaaa]]` to show it literally.')).toEqual([])
    expect(texts('Write `[[bean-aaaa]]` to show it literally.')).toContain('[[bean-aaaa]]')
  })

  it('leaves an unmatched [[ as literal text', () => {
    expect(links('An unmatched [[bean-aaaa here.')).toEqual([])
    expect(texts('An unmatched [[bean-aaaa here.')).toEqual(['An unmatched [[bean-aaaa here.'])
  })

  it('leaves an empty target as literal text', () => {
    expect(links('Empty [[]] and [[ | x]] are not links.')).toEqual([])
    expect(texts('Empty [[]] and [[ | x]] are not links.')).toEqual(['Empty [[]] and [[ | x]] are not links.'])
  })

  it('does not treat a markdown link as a wikilink', () => {
    expect(links('[label](https://example.com)')).toEqual([])
  })

  it('finds links nested inside emphasis and list items', () => {
    expect(links('- *see [[bean-aaaa]]*')).toHaveLength(1)
    expect(links('> **[[bean-bbbb]]**')).toHaveLength(1)
  })

  it('finds links inside table cells', () => {
    const src = '| a | b |\n| - | - |\n| [[bean-aaaa]] | x |'
    expect(links(src)).toHaveLength(1)
  })

  it('confirms backslash escaping is indistinguishable, as documented', () => {
    // `\[\[x\]\]` collapses to the same text node as `[[x]]` before any plugin
    // runs, so it is parsed as a link. Inline code is the escape hatch instead.
    expect(links(String.raw`Escaped \[\[bean-aaaa\]\]`)).toHaveLength(1)
  })

  it('leaves a body with no links completely alone', () => {
    const tree = run('Just prose, no links.')
    expect(tree.children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', value: 'Just prose, no links.' }],
    })
  })
})
