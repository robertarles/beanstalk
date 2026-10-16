import { describe, it, expect } from 'vitest'
import { buildPrefixMap, lookupProject, EMPTY_PREFIX_MAP } from '../../lib/prefixMap'
import type { ProjectPrefix } from '../../types/beans'

const pp = (name: string, prefix: string, path = `/src/${name}`): ProjectPrefix => ({ path, name, prefix })

describe('buildPrefixMap (beanstalk-1j24)', () => {
  it('lowercases prefixes so declared and written case agree', () => {
    const map = buildPrefixMap([pp('hivelens', 'Hivelens-')])
    expect(map.entries[0].prefix).toBe('hivelens-')
    expect(lookupProject(map, 'HIVELENS-7k2p')?.name).toBe('hivelens')
  })

  it('sorts longest prefix first so a shorter prefix cannot swallow a longer one', () => {
    const map = buildPrefixMap([pp('beans', 'beans-'), pp('beanstalk', 'beanstalk-')])
    expect(map.entries.map((e) => e.prefix)).toEqual(['beanstalk-', 'beans-'])
    expect(lookupProject(map, 'beanstalk-msdy')?.name).toBe('beanstalk')
    expect(lookupProject(map, 'beans-0001')?.name).toBe('beans')
  })

  it('drops a prefix claimed by two projects and records the collision', () => {
    const map = buildPrefixMap([pp('one', 'shared-'), pp('two', 'shared-'), pp('solo', 'solo-')])
    expect(map.ambiguous.has('shared-')).toBe(true)
    expect(map.entries.map((e) => e.name)).toEqual(['solo'])
    expect(lookupProject(map, 'shared-abcd')).toBeNull()
  })

  it('treats a case-different duplicate as the same collision', () => {
    const map = buildPrefixMap([pp('one', 'Shared-'), pp('two', 'shared-')])
    expect(map.ambiguous.has('shared-')).toBe(true)
    expect(map.entries).toEqual([])
  })

  it('returns null for an id belonging to no configured project', () => {
    const map = buildPrefixMap([pp('beanstalk', 'beanstalk-')])
    expect(lookupProject(map, 'nowhere-1234')).toBeNull()
  })

  it('handles an empty project list', () => {
    const map = buildPrefixMap([])
    expect(map.entries).toEqual([])
    expect(map.ambiguous.size).toBe(0)
    expect(lookupProject(map, 'beanstalk-msdy')).toBeNull()
  })

  it('exposes an empty map for pre-load rendering', () => {
    expect(lookupProject(EMPTY_PREFIX_MAP, 'beanstalk-msdy')).toBeNull()
  })
})
