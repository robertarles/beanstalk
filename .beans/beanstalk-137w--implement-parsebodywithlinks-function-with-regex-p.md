---
# beanstalk-137w
title: Implement parseBodyWithLinks function with regex parsing
status: todo
type: task
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:34Z
parent: beanstalk-dypj
---

Implement the core parsing function that splits body text into segments using regex, handling text before/between/after links while only matching http/https URLs.

## Details

In `src/lib/markdown.ts`, implement parseBodyWithLinks:

```typescript
export function parseBodyWithLinks(body: string): BodySegment[] {
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const segments: BodySegment[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: body.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'link', text: match[1], url: match[2] });
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < body.length) {
    segments.push({ type: 'text', content: body.slice(lastIndex) });
  }
  
  return segments;
}
```

Key considerations:
- Track lastIndex to capture text between matches
- Handle edge cases: empty string, no links, consecutive links, text-only
- Regex only matches http/https schemes for security (javascript:, file: treated as plain text)
- Return empty array for empty input or single text segment for no-link input
