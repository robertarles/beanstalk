---
# beanstalk-gehc
title: 'FIX: the stale beans badge should not flash'
status: completed
type: task
priority: normal
created_at: 2026-04-15T15:06:55Z
updated_at: 2026-04-15T15:36:47Z
---

The badge on the project indicating the stale beans count should not flash.

## Summary of Changes
Removed stale-pulse class from the sidebar project badge button in Sidebar.tsx. The pulsing animation remains only on individual priority badges in BeanList.
