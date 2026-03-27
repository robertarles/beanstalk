---
# beanstalk-y0qj
title: Import tauri_plugin_opener in lib.rs
status: todo
type: task
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T12:51:33Z
updated_at: 2026-03-27T12:51:33Z
parent: beanstalk-fe3k
---

Ensure the tauri_plugin_opener crate is properly imported or available for use in the Tauri builder

## Details

In src-tauri/src/lib.rs, verify that the plugin can be referenced. Tauri plugins typically don't require an explicit `use` statement when calling `tauri_plugin_opener::init()` directly, but ensure the crate is in scope. Check existing plugin usage pattern (e.g., tauri_plugin_log) for consistency.
