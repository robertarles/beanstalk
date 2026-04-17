---
# beanstalk-741c
title: 'FEAT: Add a priority filter in the 1st column.'
status: completed
type: task
priority: normal
created_at: 2026-04-10T20:42:18Z
updated_at: 2026-04-10T21:00:58Z
---

There should be a priority filter. above the status filter. It should consist of a static list of valid `beans` priorities: critical, high, normal, low, deferred.

## Summary of Changes

Added `BEAN_PRIORITIES` constant and `priorityFilter`/`onPriorityFilter` props to Sidebar. Priority filter section appears above the status filter, using the same checkbox-button style (blue highlight when active, ✓ indicator). Added `filterByPriority` to BeanList (same recursive pattern as filterByStatus) applied between status and tag filters. Wired state in App.tsx.
