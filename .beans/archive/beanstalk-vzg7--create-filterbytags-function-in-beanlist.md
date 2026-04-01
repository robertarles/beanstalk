---
# beanstalk-vzg7
title: Create filterByTags function in BeanList
status: scrapped
type: epic
priority: high
tags:
    - master
    - tm_id:6
created_at: 2026-04-01T16:06:07Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-ghh8
blocked_by:
    - beanstalk-4ypx
---

Implement recursive tag filtering function in BeanList component, mirroring filterByStatus

## Details

In `src/components/BeanList.tsx`, create a `filterByTags` function that filters beans based on selected tags using AND logic.

Implementation approach:
1. Add function near `filterByStatus` (around line 77)
2. Use recursive pattern matching filterByStatus
3. A bean passes the filter if it has ALL selected tags (AND logic)
4. Include bean if it matches OR if any children match (preserve tree structure)
5. Return empty array if tags parameter is empty (no filtering)

Pseudo-code:
```typescript
/** Collect all beans that have ALL specified tags (AND logic) */
function filterByTags(beans: Bean[], tags: string[]): Bean[] {
  if (tags.length === 0) return beans;
  
  return beans.reduce<Bean[]>((acc, bean) => {
    const filteredChildren = filterByTags(bean.children ?? [], tags);
    
    // Bean must have ALL tags in the filter (AND logic)
    const hasAllTags = tags.every(tag => bean.tags.includes(tag));
    
    if (hasAllTags || filteredChildren.length > 0) {
      acc.push({ ...bean, children: filteredChildren });
    }
    return acc;
  }, []);
}
```
