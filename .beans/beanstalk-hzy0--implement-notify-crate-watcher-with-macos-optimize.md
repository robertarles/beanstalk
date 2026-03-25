---
# beanstalk-hzy0
title: Implement notify crate watcher with macOS-optimized FSEvents backend
status: todo
type: task
tags:
    - master
    - tm_id:2
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-mwxa
---

Configure the notify crate watcher with platform-specific optimizations and recursive directory watching

## Details

1. Add notify dependency to Cargo.toml with appropriate version
2. Import notify::RecommendedWatcher which uses FSEvents on macOS
3. Import notify::{Watcher, RecursiveMode, Result, Event}
4. Import notify::event::{EventKind, ModifyKind} for event filtering
5. Create channel (mpsc::channel) for receiving file system events
6. Initialize RecommendedWatcher with event handler closure
7. Configure watcher to watch .beans/ directory with RecursiveMode::Recursive
8. Store watcher instance in FileWatcher struct
9. Add error handling for watcher creation failures (permissions, invalid paths)
