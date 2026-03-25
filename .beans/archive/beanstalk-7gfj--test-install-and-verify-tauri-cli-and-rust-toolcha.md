---
# beanstalk-7gfj
title: 'Test: Install and verify Tauri CLI and Rust toolchain'
status: completed
type: task
priority: normal
tags:
    - tm_id:1.testStrategy
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T20:22:40Z
parent: beanstalk-ax33
blocked_by:
    - beanstalk-9rm4
---

Run `cargo tauri --version` and verify it outputs version 1.5 or higher. Run `rustc --version` to confirm Rust toolchain is available. Verify Xcode CLI tools with `xcode-select -p`.
