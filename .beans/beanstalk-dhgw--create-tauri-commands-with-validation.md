---
# beanstalk-dhgw
title: Create Tauri commands with validation
status: todo
type: task
tags:
    - master
    - tm_id:5
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-lk6u
---

Implement Tauri command layer (get_config, save_config, add_project, remove_project) with .beans/ directory validation and error handling

## Details

Create four Tauri commands: 1) get_config() -> Result<AppConfig> that calls load_config(), 2) save_config(config: AppConfig) -> Result<()> that calls save_config(), 3) add_project(path: String) -> Result<ProjectConfig> that validates path contains .beans/ directory, extracts project name from path, creates ProjectConfig, loads current config, adds project to list, saves config, and returns the ProjectConfig, 4) remove_project(path: String) -> Result<()> that loads config, filters out matching project, and saves. Use #[tauri::command] attribute and proper error types that serialize to frontend. Register all commands in main.rs.
