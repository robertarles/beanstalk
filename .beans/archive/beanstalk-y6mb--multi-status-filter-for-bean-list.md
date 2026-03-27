---
# beanstalk-y6mb
title: Multi-status filter for bean list
status: completed
type: feature
priority: high
created_at: 2026-03-26T14:25:34Z
updated_at: 2026-03-26T14:27:56Z
---

Replace the single-status filter dropdown with a multi-select that shows all available statuses from the project config. Users should be able to select multiple statuses simultaneously (e.g. 'done' + 'scrapped', or 'in-progress' + 'open' + 'draft').

## Summary of Changes\n\n- **App.tsx**: Replaced hardcoded `AVAILABLE_STATUSES` with `collectStatuses()` that derives unique statuses from loaded beans. `statusFilter` state changed from `string | null` to `string[]`.\n- **Sidebar.tsx**: Multi-select UI with checkboxes. Clicking a status toggles it in/out of the filter array. 'All' clear button appears when any filter is active.\n- **BeanList.tsx**: `filterByStatus` now accepts `string[]` and matches any status in the array. Empty array = show all.\n- Tests updated accordingly.
