---
# beanstalk-l2fg
title: Show priority and tags in BeanList center column
status: completed
type: feature
priority: normal
created_at: 2026-03-31T21:03:49Z
updated_at: 2026-03-31T21:09:16Z
---

Add priority badge and tag chips to each row in the center column list view. Priority is currently in YAML but not parsed by Rust. Tags are in the data model but not shown in the list. Use a two-line row layout with a sub-row for priority badge + tag chips.

## Summary of Changes

- Added `priority: Option<String>` field to Rust `Bean` struct in `src-tauri/src/beans/mod.rs` and parse it from YAML frontmatter
- Updated `update_bean` in `src-tauri/src/commands.rs` to preserve priority when saving beans
- Added `priority: string | null` to TypeScript `Bean` interface in `src/types/beans.ts`
- Added `priority: null` to `makeBean()` in both `BeanList.test.tsx` and `BeanDetail.test.tsx`
- Added `priorityBadgeClass()` helper to `BeanList.tsx` with color coding (critical=red, high=orange, low=sky, deferred=gray, normal=no badge)
- Restructured each row in `BeanList.tsx` to a two-line layout: existing top row unchanged, optional sub-row shows priority badge + tag chips (capped at 3 + overflow count)
- All 69 tests pass, Rust compiles cleanly
