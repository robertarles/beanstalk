---
title: "FIX: when editing the priority in beanstalk, clicking save loses the change."
status: completed
type: task
priority: normal
created_at: 2026-04-06T17:44:56Z
updated_at: 2026-04-10T16:32:57Z
---

clicking save says “bean saved” but the priority is not updated.

## Summary of Changes

Added `editPriority` to the `handleSave` useCallback dependency array in BeanDetail.tsx (line 148). The missing dependency caused a stale closure where the selected priority value was never captured when clicking Save — the initial priority was always used instead.
