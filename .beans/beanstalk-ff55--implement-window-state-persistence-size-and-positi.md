---
# beanstalk-ff55
title: Implement window state persistence (size and position)
status: todo
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T18:05:43Z
parent: beanstalk-d6mi
blocked_by:
    - beanstalk-ynu2
---

Save window size and position to config on close, restore on launch using Tauri window API

## Details

1. Add window state fields to AppConfig in config.rs:
   - window_size: Option<(u32, u32)>
   - window_position: Option<(i32, i32)>
2. Create Tauri command to save window state:
   - get_window_size() using window.inner_size()
   - get_window_position() using window.outer_position()
   - Call on window close event or app exit
3. On app launch, read config and restore:
   - If window_size exists, call window.set_size()
   - If window_position exists, call window.set_position()
   - Ensure position is on-screen (handle multi-monitor changes)
4. Handle edge cases: first launch (no saved state), invalid positions
