---
# beanstalk-u36b
title: 'FEAT: show stale-item count badge next to project name in sidebar'
status: completed
type: feature
priority: normal
created_at: 2026-04-15T11:41:32Z
updated_at: 2026-04-15T11:42:49Z
---

If a project has any stale beans (critical not updated in 12h, or high not updated in 48h), show a pulsing badge with the stale count next to the project name in the first/sidebar column.

## Summary of Changes

- Added `countStaleBeans()` helper in App.tsx (same 12h/48h thresholds as the badge in BeanList).
- Computed `staleCounts: Record<string, number>` in App.tsx via useMemo, keyed by project path, only populated for the active project.
- Added `staleCounts` prop to Sidebar; when a project has a positive count, a red pulsing pill badge (reusing the `stale-pulse` animation) appears inline next to the project name.
