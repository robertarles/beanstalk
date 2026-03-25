---
# beanstalk-duwd
title: New bean fails to save when tags are empty
status: completed
type: bug
priority: normal
created_at: 2026-03-25T22:15:55Z
updated_at: 2026-03-25T22:27:02Z
---

When creating a new bean with no tags, the save operation fails. Beans with tags save correctly. The issue is likely in the tag serialization/validation logic — an empty tags array or undefined tags value may be causing a backend command error or frontend validation failure.

## Summary of Changes\n\nChanged `tags` parameter in the `create_bean` Tauri command from `Vec<String>` to `Option<Vec<String>>` with `unwrap_or_default()`. The frontend passes `undefined` when no tags are provided, which Tauri's deserializer couldn't map to a non-optional `Vec<String>`, causing the save to fail. Updated all 11 test call sites to pass `Some(vec\![])`.
