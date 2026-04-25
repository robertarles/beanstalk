/**
 * Fuzzy-match a query against a target string (fzf-style).
 *
 * Returns a numeric score if all query characters appear in the target in
 * order (gaps allowed), or null if the query does not match. Higher scores
 * mean a better match (closer character clusters, earlier start position).
 *
 * Algorithm:
 *  - Walk through query characters and greedily find each one in the target.
 *  - All query characters must be found in order for any match.
 *  - Score = (consecutive-run bonus) - (span penalty) - (start-position penalty)
 *    so shorter spans and earlier starts rank higher.
 */
export function fuzzyScore(query: string, target: string): number | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  if (q.length === 0) return 0;

  let qi = 0;
  let firstMatch = -1;
  let lastMatch = -1;
  let consecutiveBonus = 0;
  let prevMatch = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      if (firstMatch === -1) firstMatch = ti;
      lastMatch = ti;
      if (prevMatch !== -1 && ti === prevMatch + 1) consecutiveBonus += 5;
      prevMatch = ti;
      qi++;
    }
  }

  if (qi < q.length) return null; // not all chars matched

  const span = lastMatch - firstMatch + 1;
  return consecutiveBonus - span - firstMatch;
}

/**
 * Filter and rank a list of items against a fuzzy query.
 *
 * Each item is converted to searchable strings via `getFields`. Items are
 * included if any field matches; they are ranked by the best field score.
 */
export function fuzzyFilterItems<T>(
  items: T[],
  query: string,
  getFields: (item: T) => string[],
): T[] {
  if (!query.trim()) return items;

  const results: { item: T; score: number }[] = [];
  for (const item of items) {
    const fields = getFields(item);
    let best = -Infinity;
    for (const field of fields) {
      const s = fuzzyScore(query, field);
      if (s !== null && s > best) best = s;
    }
    if (best !== -Infinity) results.push({ item, score: best });
  }

  results.sort((a, b) => b.score - a.score);
  return results.map(r => r.item);
}
