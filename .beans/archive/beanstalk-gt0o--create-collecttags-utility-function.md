---
# beanstalk-gt0o
title: Create collectTags utility function
status: scrapped
type: epic
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-ghh8
---

Add a utility function to collect unique tags from bean tree, similar to collectStatuses

## Details

In `src/components/App.tsx`, create a `collectTags` function that recursively traverses the bean tree and collects all unique tag values.

Implementation approach:
1. Mirror the pattern of `collectStatuses` (lines 17-23)
2. Recursively traverse bean tree collecting tags from `bean.tags` array
3. Return sorted unique tags
4. Place this function near `collectStatuses` for consistency

Pseudo-code:
```typescript
/** Collect unique tags from a bean tree. */
function collectTags(beans: Bean[], out = new Set<string>()): string[] {
  for (const b of beans) {
    // Tags are an array on each bean
    for (const tag of b.tags) {
      out.add(tag);
    }
    if (b.children) collectTags(b.children, out);
  }
  return [...out].sort(); // Sort alphabetically
}
```

Usage in App component:
```typescript
const availableStatuses = collectStatuses(beans);
const availableTags = collectTags(beans); // Add this line
```
