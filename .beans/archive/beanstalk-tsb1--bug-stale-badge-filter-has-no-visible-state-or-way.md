---
# beanstalk-tsb1
title: 'BUG: stale badge filter has no visible state or way to clear it from sidebar filters'
status: completed
type: bug
priority: normal
created_at: 2026-04-15T12:27:44Z
updated_at: 2026-04-15T12:32:15Z
---

After clicking the stale-count badge, the bean list filters to only stale beans but the sidebar filter controls (priority, status, tag) do not reflect this active filter state and cannot affect it. The stale filter should be expressed through the existing sidebar filter controls — activating it should update the priority/status/tag selections to match what's stale, and the user should be able to further narrow or clear the filter by changing those selections normally.

## Summary of Changes

Removed the separate staleFilter boolean mechanism entirely. The stale badge click now calls onPriorityFilter(['critical', 'high']), which sets the existing priority filter in the sidebar. The filter is now visible in the Priority section, clearable by deselecting priorities or clicking All, and composable with status/tag filters. Removed: filterToStale, collectAncestorIds, staleFilter prop from BeanList, staleFilter state from App, staleFilter/onStaleFilter props from Sidebar.
