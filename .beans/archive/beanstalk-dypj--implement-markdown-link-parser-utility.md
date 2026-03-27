---
# beanstalk-dypj
title: Implement markdown link parser utility
status: completed
type: epic
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:58:17Z
parent: beanstalk-rcdr
---

Create a utility function to parse markdown links and split body text into renderable segments

## Details

Create a utility function `parseBodyWithLinks(body: string)` that splits the body text using the regex `/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g` with capture groups. The function should return an array of segments, each tagged with `type: 'text' | 'link'` and relevant data (text content for plain text, linkText and url for links). Example:
```typescript
type BodySegment = 
  | { type: 'text'; content: string }
  | { type: 'link'; text: string; url: string };

function parseBodyWithLinks(body: string): BodySegment[] {
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
Place this in a new file `src/lib/markdown.ts` or directly in BeanDetail.tsx as a helper.
