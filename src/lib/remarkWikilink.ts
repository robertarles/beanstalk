import type { Root, Text, PhrasingContent, RootContent } from 'mdast';
import type { Node, Parent } from 'unist';

/**
 * The mdast node a `[[...]]` run becomes.
 *
 * Carries the raw target only — resolving it to a bean is a separate concern
 * (`src/lib/resolveWikilink.ts`), so this plugin stays a pure mdast transform
 * with nothing to mock.
 *
 * `data.hName` / `data.hProperties` are the standard mdast→hast escape hatch:
 * they make the node arrive at ReactMarkdown as a `<wikilink>` element, which a
 * `components` entry can then render.
 */
export interface Wikilink extends Node {
  type: 'wikilink';
  /** The raw text inside the brackets, before the `|`, trimmed. */
  target: string;
  /** The alias after the `|`, trimmed; `null` when no alias was written. */
  display: string | null;
  data: {
    hName: 'wikilink';
    hProperties: { target: string; display?: string };
  };
}

/**
 * `[[target]]` or `[[target|display]]`.
 *
 * The inner run excludes brackets, so an unmatched `[[` is simply not a match and
 * adjacent links (`[[a]][[b]]`) are two matches rather than one greedy one.
 */
const WIKILINK = /\[\[([^[\]]*)\]\]/g;

/** Node types whose contents are verbatim or already a link, and are left alone. */
const OPAQUE = new Set(['code', 'inlineCode', 'link', 'linkReference', 'definition', 'wikilink']);

function makeWikilink(target: string, display: string | null): Wikilink {
  return {
    type: 'wikilink',
    target,
    display,
    data: {
      hName: 'wikilink',
      hProperties: display === null ? { target } : { target, display },
    },
  };
}

/**
 * Split one text node's value into text and wikilink nodes.
 *
 * Returns `null` when the value holds no wikilink, so the caller can leave the
 * original node untouched rather than replacing it with an equal copy.
 */
function splitText(value: string): PhrasingContent[] | null {
  WIKILINK.lastIndex = 0;
  let match = WIKILINK.exec(value);
  if (match === null) return null;

  const out: PhrasingContent[] = [];
  let cursor = 0;

  while (match !== null) {
    const [raw, inner] = match;
    const pipe = inner.indexOf('|');
    const target = (pipe === -1 ? inner : inner.slice(0, pipe)).trim();
    // Only the first `|` splits; later ones belong to the display text.
    const rawDisplay = pipe === -1 ? null : inner.slice(pipe + 1).trim();

    if (target === '') {
      // `[[]]` or `[[ |x]]` names nothing. Not a link — keep it as literal text
      // by simply not consuming it here.
      match = WIKILINK.exec(value);
      continue;
    }

    if (match.index > cursor) {
      out.push({ type: 'text', value: value.slice(cursor, match.index) } as Text);
    }
    // An empty alias (`[[id|]]`) falls back to rendering the id.
    out.push(makeWikilink(target, rawDisplay === '' ? null : rawDisplay) as unknown as PhrasingContent);
    cursor = match.index + raw.length;

    match = WIKILINK.exec(value);
  }

  if (out.length === 0) return null;
  if (cursor < value.length) {
    out.push({ type: 'text', value: value.slice(cursor) } as Text);
  }
  return out;
}

function isParent(node: Node): node is Parent {
  return Array.isArray((node as Parent).children);
}

function transform(node: Node): void {
  if (!isParent(node)) return;

  const next: Node[] = [];
  let changed = false;

  for (const child of node.children) {
    if (OPAQUE.has(child.type)) {
      next.push(child);
      continue;
    }
    if (child.type === 'text') {
      const split = splitText((child as Text).value);
      if (split !== null) {
        next.push(...(split as unknown as Node[]));
        changed = true;
        continue;
      }
      next.push(child);
      continue;
    }
    transform(child);
    next.push(child);
  }

  if (changed) node.children = next as RootContent[];
}

/**
 * remark plugin turning `[[...]]` runs in bean bodies into {@link Wikilink} nodes.
 *
 * A remark plugin rather than a regex over the raw body: this repo removed a
 * hand-rolled `parseBodyWithLinks` in favour of ReactMarkdown, and matching the
 * raw string would both walk that back and match inside fenced code blocks.
 *
 * Note that backslash escaping cannot work here, by design of markdown itself:
 * `\[\[x\]\]` and `[[x]]` produce byte-identical text nodes, the escape having
 * been consumed before any plugin sees the tree. Inline code is the escape hatch
 * — `` `[[x]]` `` is an `inlineCode` node and is skipped.
 */
export function remarkWikilink() {
  return (tree: Root): void => {
    transform(tree as unknown as Node);
  };
}
