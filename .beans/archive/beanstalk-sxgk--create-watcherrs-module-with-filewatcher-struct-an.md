---
# beanstalk-sxgk
title: Create watcher.rs module with FileWatcher struct and thread-safe state
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:32:23Z
parent: beanstalk-mwxa
---

Set up the foundational watcher module with proper Rust structure and thread-safe state management using Arc<Mutex<>>

## Details

1. Create `src-tauri/src/watcher.rs` file
2. Add necessary imports from notify crate and std library
3. Define FileWatcher struct with fields:
   - watcher: Option<RecommendedWatcher> (from notify)
   - tx: mpsc::Sender for event channel
   - watched_path: Option<PathBuf>
4. Wrap FileWatcher in Arc<Mutex<>> for thread-safe access
5. Add module declaration in main.rs or lib.rs
6. Create basic new() constructor that initializes empty state
7. Add Drop trait implementation for cleanup
