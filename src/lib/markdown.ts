export type BodySegment =
  | { type: 'text'; text: string }
  | { type: 'link'; text: string; url: string };

const ALLOWED_SCHEMES = ['http:', 'https:'];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_SCHEMES.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function parseBodyWithLinks(body: string): BodySegment[] {
  if (!body) return [];

  const segments: BodySegment[] = [];
  // Match markdown links: [text](url)
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(body)) !== null) {
    const [fullMatch, text, url] = match;
    const matchStart = match.index;

    if (matchStart > lastIndex) {
      segments.push({ type: 'text', text: body.slice(lastIndex, matchStart) });
    }

    if (isAllowedUrl(url)) {
      segments.push({ type: 'link', text, url });
    } else {
      segments.push({ type: 'text', text: fullMatch });
    }

    lastIndex = matchStart + fullMatch.length;
  }

  if (lastIndex < body.length) {
    segments.push({ type: 'text', text: body.slice(lastIndex) });
  }

  return segments;
}
