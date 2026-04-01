---
# beanstalk-tfnc
title: Add tagFilter state to App.tsx
status: scrapped
type: epic
priority: high
tags:
    - master
    - tm_id:2
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-ghh8
---

Add tag filter state management to App component, similar to statusFilter

## Details

In `src/components/App.tsx`, add state for tag filtering that mirrors the existing statusFilter pattern.

Implementation:
1. Add state: `const [tagFilter, setTagFilter] = useState<string[]>([])`
2. Add this near line 45 where statusFilter is defined
3. Reset tagFilter to empty array when activeProject changes (similar to statusFilter reset pattern)

Pseudo-code:
```typescript
const [statusFilter, setStatusFilter] = useState<string[]>([]);
const [tagFilter, setTagFilter] = useState<string[]>([]); // Add this line

// In the project selection handler, reset both filters:
useEffect(() => {
  setStatusFilter([]);
  setTagFilter([]); // Reset tags when project changes
}, [activeProject]);
```
