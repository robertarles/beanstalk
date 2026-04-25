import { describe, it, expect } from 'vitest';
import { fuzzyScore, fuzzyFilterItems } from '../../lib/fuzzy';

describe('fuzzyScore', () => {
  it('returns 0 for an empty query', () => {
    expect(fuzzyScore('', 'anything')).toBe(0);
  });

  it('returns null when not all query chars are present', () => {
    expect(fuzzyScore('xyz', 'abc')).toBeNull();
  });

  it('matches characters in order with gaps', () => {
    // 'bgs' should match 'my big story' (b at 3, g at 5, s at 9)
    expect(fuzzyScore('bgs', 'my big story')).not.toBeNull();
  });

  it('does not match when characters appear out of order only', () => {
    // 'zab' — 'z' does not appear in 'abc'
    expect(fuzzyScore('zab', 'abc')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(fuzzyScore('BIG', 'my big story')).not.toBeNull();
    expect(fuzzyScore('big', 'My Big Story')).not.toBeNull();
  });

  it('gives a higher score for consecutive matches', () => {
    // 'big' matching 'big story' (all consecutive) vs 'b_i_g xxxxxx' (spread out)
    const consecutive = fuzzyScore('big', 'big story');
    const spread = fuzzyScore('big', 'b and i something g');
    expect(consecutive).not.toBeNull();
    expect(spread).not.toBeNull();
    expect(consecutive!).toBeGreaterThan(spread!);
  });

  it('gives a higher score for earlier start position', () => {
    // 'abc' starting at position 0 vs position 5
    const early = fuzzyScore('abc', 'abcdef');
    const late = fuzzyScore('abc', 'xxxxxabcdef');
    expect(early).not.toBeNull();
    expect(late).not.toBeNull();
    expect(early!).toBeGreaterThan(late!);
  });
});

describe('fuzzyFilterItems', () => {
  const items = [
    { name: 'my big story', id: 'mbs-001' },
    { name: 'bugs in storage', id: 'bis-002' },
    { name: 'unrelated item', id: 'uni-003' },
    { name: 'another thing', id: 'ath-004' },
  ];
  const getFields = (item: { name: string; id: string }) => [item.name, item.id];

  it('returns all items when query is empty', () => {
    expect(fuzzyFilterItems(items, '', getFields)).toHaveLength(items.length);
  });

  it('returns all items when query is whitespace only', () => {
    expect(fuzzyFilterItems(items, '   ', getFields)).toHaveLength(items.length);
  });

  it('filters out items that do not match', () => {
    const result = fuzzyFilterItems(items, 'bgs', getFields);
    // 'my big story' has b,g,s — should match
    // 'bugs in storage' has b,g,s — should match
    // 'unrelated item' — no 'g' before 's', should not match
    const names = result.map(i => i.name);
    expect(names).toContain('my big story');
    expect(names).toContain('bugs in storage');
    expect(names).not.toContain('unrelated item');
  });

  it('matches against any field (including id)', () => {
    // query 'mbs' matches id 'mbs-001' exactly
    const result = fuzzyFilterItems(items, 'mbs', getFields);
    const names = result.map(i => i.name);
    expect(names).toContain('my big story');
  });

  it('returns results sorted best match first', () => {
    // 'big' should score higher in 'my big story' (consecutive) than 'bugs in storage' (spread)
    const result = fuzzyFilterItems(items, 'big', getFields);
    expect(result[0].name).toBe('my big story');
  });
});
