---
# beanstalk-0hoj
title: 'FIX: Selecting an “empty” priority should be valid'
status: completed
type: task
priority: critical
created_at: 2026-04-17T21:36:06Z
updated_at: 2026-04-17T22:03:57Z
---

If I try to change an issue status to “none” (no status at all), it does not save the change.

## Summary of Changes

Root cause: serde's `Option<T>` always maps JSON `null` → `None`, so sending `priority: null` from the frontend was indistinguishable from not sending the field at all (both became "keep existing").

Fix:
- Changed `update_bean` Rust parameter from `Option<Option<String>>` to `Option<String>` where `Some("")` means "clear" and `None` means "keep existing"
- In the `updateBean` TypeScript wrapper (`lib/tauri.ts`), map `priority: null` → `priority: ""` before invoking, so the backend receives `Some("")` and clears the field
