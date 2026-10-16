import { describe, it, expect } from 'vitest'
import { findWikilinkQuery, insertWikilink } from '../../lib/wikilinkAutocomplete'

describe('findWikilinkQuery (beanstalk-xc3j)', () => {
  it('finds an empty query right after [[', () => {
    expect(findWikilinkQuery('See [[', 6)).toEqual({ start: 4, query: '' })
  })

  it('finds the typed query', () => {
    expect(findWikilinkQuery('See [[resolv', 12)).toEqual({ start: 4, query: 'resolv' })
  })

  it('allows spaces, so a bean can be found by title', () => {
    expect(findWikilinkQuery('See [[the resolver task', 23)).toEqual({
      start: 4,
      query: 'the resolver task',
    })
  })

  it('returns null with no [[ before the caret', () => {
    expect(findWikilinkQuery('plain prose', 11)).toBeNull()
    expect(findWikilinkQuery('a single [ bracket', 18)).toBeNull()
  })

  it('returns null once the run is closed', () => {
    expect(findWikilinkQuery('See [[bean-aaaa]] done', 22)).toBeNull()
  })

  it('returns null when the caret has moved past a ]', () => {
    expect(findWikilinkQuery('See [[bean-aaaa]', 16)).toBeNull()
  })

  it('returns null across a newline, so an abandoned run does not linger', () => {
    expect(findWikilinkQuery('See [[\nnext line', 16)).toBeNull()
  })

  it('tracks the caret, not the end of the text', () => {
    const value = 'See [[res and later text'
    expect(findWikilinkQuery(value, 9)).toEqual({ start: 4, query: 'res' })
  })

  it('uses the nearest [[ when there are several', () => {
    expect(findWikilinkQuery('[[first]] then [[sec', 20)).toEqual({ start: 15, query: 'sec' })
  })

  it('returns null for a caret too early to hold [[', () => {
    expect(findWikilinkQuery('[[', 1)).toBeNull()
  })
})

describe('insertWikilink (beanstalk-xc3j)', () => {
  it('replaces the open run with a finished link', () => {
    const value = 'See [[resolv'
    const query = findWikilinkQuery(value, 12)!
    expect(insertWikilink(value, query, 12, 'beanstalk-4ad6')).toEqual({
      value: 'See [[beanstalk-4ad6]]',
      caret: 22,
    })
  })

  it('keeps text after the caret', () => {
    const value = 'See [[res and more'
    const query = findWikilinkQuery(value, 9)!
    expect(insertWikilink(value, query, 9, 'beanstalk-4ad6')).toEqual({
      value: 'See [[beanstalk-4ad6]] and more',
      caret: 22,
    })
  })

  it('inserts a foreign id unqualified, since prefixes disambiguate', () => {
    const value = '[[hive'
    const query = findWikilinkQuery(value, 6)!
    expect(insertWikilink(value, query, 6, 'hivelens-7k2p').value).toBe('[[hivelens-7k2p]]')
  })
})
