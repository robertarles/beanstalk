---
# beanstalk-d13p
title: Configure Cargo.toml with required dependencies
status: todo
type: task
tags:
    - master
    - tm_id:3
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-ax33
---

Add all necessary Rust dependencies to src-tauri/Cargo.toml for Tauri, serialization, file watching, and YAML parsing

## Details

1. Edit src-tauri/Cargo.toml [dependencies] section to include:
```toml
tauri = { version = "1.5", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
notify = "6.0"
walkdir = "2.0"
yaml-rust = "0.4"
chrono = { version = "0.4", features = ["serde"] }
tauri-build = "1.5"
```
2. Ensure [build-dependencies] has `tauri-build = "1.5"`
3. Run `cargo build` to download and compile dependencies
4. Verify no compilation errors
