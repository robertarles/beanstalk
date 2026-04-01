---
# beanstalk-yvsg
title: Apply filterByTags in BeanList filtering chain
status: scrapped
type: epic
priority: high
tags:
    - master
    - tm_id:8
created_at: 2026-04-01T16:06:07Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-ghh8
blocked_by:
    - beanstalk-pxoi
---

Integrate filterByTags into the BeanList filtering pipeline after statusFilter

## Details

In `src/components/BeanList.tsx`, apply the tag filter in the useMemo filtering chain after status filtering.

Implementation:
1. Locate the statusFiltered useMemo (line 213)
2. Add a new tagFiltered useMemo that applies filterByTags to statusFiltered
3. Update searchFiltered to use tagFiltered instead of statusFiltered
4. Maintain the filter order: status → tags → search

Pseudo-code:
```typescript
// Apply status filter (existing, line 213)
const statusFiltered = useMemo(
  () => filterByStatus(beans, statusFilter), 
  [beans, statusFilter]
);

// Apply tag filter (ADD THIS)
const tagFiltered = useMemo(
  () => filterByTags(statusFiltered, tagFilter),
  [statusFiltered, tagFilter]
);

// Apply search filter (UPDATE THIS - change statusFiltered to tagFiltered)
const searchFiltered = useMemo(() => {
  const q = debouncedSearch.trim().toLowerCase();
  if (!q) return tagFiltered; // Changed from statusFiltered
  function matchBean(bean: Bean): Bean | null {
    // ... existing search logic
  }
  return tagFiltered.reduce<Bean[]>((acc, bean) => { // Changed from statusFiltered
    // ... existing reduce logic
  }, []);
}, [tagFiltered, debouncedSearch]); // Changed dependency
```

Also update totalCount calculation to use statusFiltered (no change needed), ensuring the count label reflects status+tag filtering correctly.
