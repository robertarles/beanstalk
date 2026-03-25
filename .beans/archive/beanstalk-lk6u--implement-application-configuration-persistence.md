---
# beanstalk-lk6u
title: Implement application configuration persistence
status: completed
type: epic
priority: high
tags:
    - master
    - tm_id:2
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:28:07Z
parent: beanstalk-ut4w
---

Create configuration management system that stores and loads project list, preferences, and window state

## Details

1. Create `src-tauri/src/config.rs` module
2. Define AppConfig struct matching PRD requirements:
```rust
#[derive(Serialize, Deserialize, Clone)]
pub struct ProjectConfig {
    pub path: PathBuf,
    pub name: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub projects: Vec<ProjectConfig>,
    pub last_active_project: Option<PathBuf>,
    pub editor: Option<String>,
    pub window_size: Option<(u32, u32)>,
}
```
3. Implement config file location: `~/Library/Application Support/Beanstalk/config.json`
4. Use `tauri::api::path::app_config_dir()` to get platform-specific config directory
5. Implement load_config() function with default fallback
6. Implement save_config() function with atomic writes (write to temp, then rename)
7. Create Tauri commands:
   - `get_config() -> Result<AppConfig>`
   - `save_config(config: AppConfig) -> Result<()>`
   - `add_project(path: String) -> Result<ProjectConfig>`
   - `remove_project(path: String) -> Result<()>`
8. Validate project paths contain `.beans/` directory before adding
9. Handle file I/O errors gracefully with proper error types
