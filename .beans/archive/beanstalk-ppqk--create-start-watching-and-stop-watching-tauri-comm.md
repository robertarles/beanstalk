---
# beanstalk-ppqk
title: Create start_watching and stop_watching Tauri commands with lifecycle management
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:6
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:32:23Z
parent: beanstalk-mwxa
---

Implement Tauri commands for starting and stopping the file watcher with proper cleanup when switching projects

## Details

1. Create start_watching Tauri command:
   ```rust
   #[tauri::command]
   async fn start_watching(app_handle: AppHandle, project_path: String, state: State<Arc<Mutex<FileWatcher>>>) -> Result<(), String>
   ```
2. In start_watching:
   - Stop existing watcher if running
   - Validate project_path exists and contains .beans/ directory
   - Construct full path to .beans/ directory
   - Initialize new watcher instance
   - Store watcher in state
   - Return Ok or error message
3. Create stop_watching command:
   ```rust
   #[tauri::command]
   async fn stop_watching(state: State<Arc<Mutex<FileWatcher>>>) -> Result<(), String>
   ```
4. In stop_watching:
   - Lock state mutex
   - Drop watcher instance (triggers cleanup)
   - Clear watched_path
   - Return Ok
5. Handle errors gracefully: directory deleted, permission denied, invalid path
6. Register commands in tauri::Builder in main.rs
7. Add state management for FileWatcher in Tauri app builder
8. Add logging for command invocations
