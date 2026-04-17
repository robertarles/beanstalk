---
# beanstalk-37iz
title: 'BUG: stale flash persists after update makes issue no longer stale'
status: completed
type: bug
priority: normal
created_at: 2026-04-15T11:49:40Z
updated_at: 2026-04-15T11:57:41Z
---

When a stale bean (critical >12h or high >48h) is updated, the pulsing stale-pulse animation on the priority badge continues to flash even though the bean is no longer stale. The staleness check uses Date.now() at render time so it should recompute, but something is preventing a re-render or the updated_at field is not being reflected correctly after save.

## Summary of Changes

Root cause: after any bean mutation, the return value (which contains fresh updated_at) was ignored. App just called refresh() fire-and-forget. If re-render happened before loadBeans() resolved, old bean data with stale updated_at was still in state, keeping isStale() returning true.

Fix: added applyBeanUpdate(updated: Bean) to useBeans that immediately splices the returned bean (with fresh updated_at) into the tree state. handleSave, handleStatusChange, and handlePriorityChange all now call applyBeanUpdate(result) immediately after the await, before calling refresh(). This guarantees isStale() sees the fresh updated_at in the very next render.
