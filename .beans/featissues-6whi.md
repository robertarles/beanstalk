---
# featissues
title: FEAT:issues list. Allow sort by priority column
status: completed
type: task
priority: normal
created_at: 2026-04-17T23:42:24Z
updated_at: 2026-04-17T23:45:16Z
---

Oddly, this column does not sort?  Sort where critical=40, high=30, normal=20, low=10, none=00

## Summary of Changes

Added priority sorting to the issues list:
- Added `'priority'` to the `SortColumn` type
- Added `PRIORITY_WEIGHT` map (critical=40, high=30, normal=20, low=10, none=0) and `priorityWeight()` helper
- Updated `sortBeans()` to compare by weight when `sort.column === 'priority'`
- Changed the Priority column header from a static `<span>` to a clickable `<button>` with a `SortArrow`
