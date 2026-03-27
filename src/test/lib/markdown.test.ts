import { describe, it, expect } from 'vitest'
import { parseBodyWithLinks } from '../../lib/markdown'

describe('parseBodyWithLinks', () => {
  it('returns empty array for empty string', () => {
    expect(parseBodyWithLinks('')).toEqual([])
  })

  it('returns single text segment for plain text', () => {
    expect(parseBodyWithLinks('hello world')).toEqual([
      { type: 'text', text: 'hello world' },
    ])
  })

  it('parses a single link in the middle of text', () => {
    const result = parseBodyWithLinks('see [docs](https://example.com) here')
    expect(result).toEqual([
      { type: 'text', text: 'see ' },
      { type: 'link', text: 'docs', url: 'https://example.com' },
      { type: 'text', text: ' here' },
    ])
  })

  it('parses multiple links', () => {
    const result = parseBodyWithLinks('[a](https://a.com) and [b](https://b.com)')
    expect(result).toEqual([
      { type: 'link', text: 'a', url: 'https://a.com' },
      { type: 'text', text: ' and ' },
      { type: 'link', text: 'b', url: 'https://b.com' },
    ])
  })

  it('parses consecutive links with no text between', () => {
    const result = parseBodyWithLinks('[a](https://a.com)[b](https://b.com)')
    expect(result).toEqual([
      { type: 'link', text: 'a', url: 'https://a.com' },
      { type: 'link', text: 'b', url: 'https://b.com' },
    ])
  })

  it('parses a link at the start', () => {
    const result = parseBodyWithLinks('[docs](https://example.com) text')
    expect(result).toEqual([
      { type: 'link', text: 'docs', url: 'https://example.com' },
      { type: 'text', text: ' text' },
    ])
  })

  it('parses a link at the end', () => {
    const result = parseBodyWithLinks('text [docs](https://example.com)')
    expect(result).toEqual([
      { type: 'text', text: 'text ' },
      { type: 'link', text: 'docs', url: 'https://example.com' },
    ])
  })

  it('does not parse bare URLs as links', () => {
    const result = parseBodyWithLinks('visit https://example.com now')
    expect(result).toEqual([
      { type: 'text', text: 'visit https://example.com now' },
    ])
  })

  it('treats javascript: scheme links as plain text', () => {
    const result = parseBodyWithLinks('[bad](javascript:void(0))')
    // URL matches but is not allowed; rendered as plain text
    // Note: the `)` inside the URL causes the regex to split at first `)`,
    // leaving a trailing `)` as a separate text segment
    const allText = result.map((s) => s.text).join('')
    expect(allText).toBe('[bad](javascript:void(0))')
    result.forEach((s) => expect(s.type).toBe('text'))
  })

  it('treats file: scheme links as plain text', () => {
    const result = parseBodyWithLinks('[local](file:///etc/passwd)')
    expect(result).toEqual([
      { type: 'text', text: '[local](file:///etc/passwd)' },
    ])
  })

  it('ignores malformed markdown: missing closing bracket', () => {
    const result = parseBodyWithLinks('[text(https://example.com)')
    expect(result).toEqual([
      { type: 'text', text: '[text(https://example.com)' },
    ])
  })

  it('ignores malformed markdown: missing closing paren', () => {
    const result = parseBodyWithLinks('[text](https://example.com')
    expect(result).toEqual([
      { type: 'text', text: '[text](https://example.com' },
    ])
  })

  it('ignores malformed markdown: orphaned closing bracket-paren', () => {
    const result = parseBodyWithLinks('text](https://example.com)')
    expect(result).toEqual([
      { type: 'text', text: 'text](https://example.com)' },
    ])
  })
})
