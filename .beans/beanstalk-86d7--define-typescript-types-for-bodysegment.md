---
# beanstalk-86d7
title: Define TypeScript types for BodySegment
status: todo
type: task
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:34Z
parent: beanstalk-dypj
---

Create the BodySegment discriminated union type that distinguishes between plain text segments and link segments in parsed markdown content.

## Details

Create a new file `src/lib/markdown.ts` and define the BodySegment type as a discriminated union:

```typescript
export type BodySegment = 
  | { type: 'text'; content: string }
  | { type: 'link'; text: string; url: string };
```

The 'text' variant holds plain text content between links, while the 'link' variant holds the link display text and URL. This type enables type-safe handling when rendering segments in React components.
