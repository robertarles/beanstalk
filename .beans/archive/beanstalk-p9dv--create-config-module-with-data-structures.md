---
# beanstalk-p9dv
title: Create config module with data structures
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:28:07Z
parent: beanstalk-lk6u
---

Create src-tauri/src/config.rs module and define AppConfig and ProjectConfig structs with serde serialization support

## Details

Create the config.rs module file and define two structs: ProjectConfig (with path: PathBuf and name: String fields) and AppConfig (with projects: Vec<ProjectConfig>, last_active_project: Option<PathBuf>, editor: Option<String>, and window_size: Option<(u32, u32)> fields). Add #[derive(Serialize, Deserialize, Clone)] attributes to both structs for JSON serialization. Import necessary dependencies (serde, PathBuf, etc.).
