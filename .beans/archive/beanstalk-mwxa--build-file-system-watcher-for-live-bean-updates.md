---
# beanstalk-mwxa
title: Build file system watcher for live bean updates
status: completed
type: epic
priority: high
tags:
    - master
    - tm_id:4
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:32:23Z
parent: beanstalk-ut4w
---

Implement real-time file watching of .beans/ directory with efficient change notifications to frontend

## Details

1. Create `src-tauri/src/watcher.rs` module
2. Use `notify` crate with recommended watcher for macOS:
```rust
use notify::{Watcher, RecursiveMode, Result};
use notify::event::{EventKind, ModifyKind};
```
3. Implement FileWatcher struct that:
   - Maintains a channel for sending events to main thread
   - Watches the active project's .beans/ directory
   - Debounces rapid file changes (500ms window)
   - Filters for .md and .yml file changes only
4. Create Tauri event emission on file changes:
   - Emit "beans-changed" event with change type (created/modified/deleted)
   - Include affected file path or bean ID
5. Implement start_watching(project_path: PathBuf) command
6. Implement stop_watching() command for cleanup when switching projects
7. Handle watcher errors (directory deleted, permissions issues) gracefully
8. Optimize: only rescan changed files, not entire directory
9. Add visual indicator data in event payload (timestamp, change type)
10. Use Arc<Mutex<>> for thread-safe watcher state management
