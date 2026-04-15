---
# beanstalk-szw9
title: 'FEAT: clicking stale-count badge in sidebar filters list to show only stale beans'
status: completed
type: feature
priority: normal
created_at: 2026-04-15T11:49:40Z
updated_at: 2026-04-15T11:57:47Z
---

When the user clicks the stale-count badge next to a project name in the sidebar, the bean list should filter to show only stale beans. Parent items should be unfolded/expanded as needed so all stale beans are visible. Clicking the badge again (or some other affordance) should clear the filter.

## Summary of Changes

- Added staleFilter: boolean state to App.tsx; cleared on project switch.
- Sidebar badge is now a <button> that calls onStaleFilter(!staleFilter) on click; turns darker red (bg-red-700) when active.
- BeanList gains staleFilter prop. When true: filterToStale() prunes the tree to only stale beans and their ancestors; collectAncestorIds() auto-expands parent nodes that contain stale descendants; the entire filter/search pipeline uses the stale-filtered list.
