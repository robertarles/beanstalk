---
# feature
title: 'FEATURE: priority should be a default field in a beans view'
status: completed
type: task
priority: normal
created_at: 2026-04-06T17:47:25Z
updated_at: 2026-04-10T16:33:03Z
---

priority should be a default field in a beans view  (3rd column) and should allow a selection of only valid bean priorities -> (critical, high, normal, low, deferred, or empty to clear)

## Summary of Changes

- **BeanList.tsx**: Added Priority as a dedicated 3rd column (between Title and Status) in the list header and each row. Shows a colored badge (critical=red, high=orange, low=sky, deferred=gray) or a dash for unset. Removed priority from the sub-row since it's now always visible in the main row.
- **BeanDetail.tsx**: Added `onPriorityChange` prop and `BEAN_PRIORITIES` constant. In view mode, Priority is now always shown as an inline select (like Status) with valid options: critical, high, normal, low, deferred, or empty to clear.
- **App.tsx**: Added `handlePriorityChange` callback that calls `updateBean` with only the priority field, wired to `BeanDetail` via `onPriorityChange` prop.
