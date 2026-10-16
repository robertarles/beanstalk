/** An open `[[` run at the caret, waiting to be completed. */
export interface WikilinkQuery {
  /** Index of the first `[` of the opening `[[`. */
  start: number;
  /** Text typed between `[[` and the caret. */
  query: string;
}

/**
 * Find the unterminated `[[` run the caret sits inside, if any.
 *
 * Returns `null` when the caret is not inside one — which is what dismisses the
 * picker, rather than any explicit close. Spaces are deliberately allowed in the
 * query: the whole point of the picker is finding a bean by title, and titles have
 * spaces in them.
 */
export function findWikilinkQuery(value: string, caret: number): WikilinkQuery | null {
  if (caret < 2) return null;

  const start = value.lastIndexOf('[[', caret - 2);
  if (start === -1) return null;

  const query = value.slice(start + 2, caret);

  // A `]` or a newline means the run is closed or abandoned. `[` means a newer
  // `[[` began, but `lastIndexOf` already found the closest one, so only a lone
  // `[` can appear here — treat it as abandoned too.
  if (/[\]\n[]/.test(query)) return null;

  return { start, query };
}

/** The result of accepting a completion: the new value and where the caret goes. */
export interface WikilinkInsertion {
  value: string;
  caret: number;
}

/**
 * Replace an open `[[` run with a finished `[[id]]`.
 *
 * Ids need no project qualification even when the chosen bean lives elsewhere:
 * prefixes already make them unambiguous.
 */
export function insertWikilink(
  value: string,
  query: WikilinkQuery,
  caret: number,
  id: string
): WikilinkInsertion {
  const link = `[[${id}]]`;
  const before = value.slice(0, query.start);
  const after = value.slice(caret);
  return { value: `${before}${link}${after}`, caret: query.start + link.length };
}
