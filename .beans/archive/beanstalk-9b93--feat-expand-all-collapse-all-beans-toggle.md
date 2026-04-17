---
# beanstalk-9b93
title: 'FEAT: expand all, collapse all beans toggle'
status: completed
type: task
priority: normal
created_at: 2026-04-15T15:06:01Z
updated_at: 2026-04-15T15:36:47Z
---

Add an expand/collapse button below search and above the title bar of the beans column (column 2) It should fit in the same row as the visible beans count (e.g. “1 beans”)

## Summary of Changes
Added expand/collapse all toggle button inline with the beans count row in BeanList.tsx. Computes allExpanded from the expanded map vs idsWithChildren. Shows '⊕ expand all' or '⊖ collapse all'; only visible when there are beans with children.
