---
# beanstalk-v5m3
title: Create Tauri backend commands for bean operations
status: completed
type: epic
priority: high
tags:
    - master
    - tm_id:5
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:32:23Z
parent: beanstalk-ut4w
---

Implement Tauri command layer for all bean CRUD operations and project management

## Details

1. Create `src-tauri/src/commands.rs` module
2. Implement Tauri commands with #[tauri::command] macro:

```rust
#[tauri::command]
async fn get_beans(project_path: String) -> Result<Vec<Bean>, String>

#[tauri::command]
async fn get_bean(project_path: String, bean_id: String) -> Result<Bean, String>

#[tauri::command]
async fn create_bean(project_path: String, title: String, status: String, tags: Vec<String>, body: String) -> Result<Bean, String>

#[tauri::command]
async fn update_bean(project_path: String, bean_id: String, updates: BeanUpdate) -> Result<Bean, String>

#[tauri::command]
async fn update_bean_status(project_path: String, bean_id: String, status: String) -> Result<(), String>

#[tauri::command]
async fn open_bean_in_editor(file_path: String, editor: Option<String>) -> Result<(), String>

#[tauri::command]
async fn get_project_info(project_path: String) -> Result<BeansConfig, String>

#[tauri::command]
async fn search_beans(project_path: String, query: String) -> Result<Vec<Bean>, String>
```

3. Implement create_bean logic:
   - Generate unique ID (timestamp-based or UUID)
   - Create markdown file with YAML frontmatter
   - Follow beans naming conventions
   - Write to .beans/ directory
4. Implement update_bean logic:
   - Read existing file, update metadata, rewrite
   - Preserve body content unless explicitly changed
5. Implement open_bean_in_editor:
   - Use `editor` param, fall back to env var EDITOR, then macOS default for .md
   - Use std::process::Command to spawn editor process
   - Use `open -a TextEdit` as final fallback on macOS
6. Implement search_beans with case-insensitive title and body matching
7. Register all commands in main.rs tauri::Builder
8. Use proper error handling with Result types and descriptive error messages
