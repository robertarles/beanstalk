---
# beanstalk-ax33
title: Initialize Tauri project structure with Rust backend
status: todo
type: epic
priority: high
tags:
    - master
    - tm_id:1
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-ut4w
---

Set up the Tauri application framework with Rust backend and web frontend scaffolding for macOS

## Details

1. Install Tauri CLI: `cargo install tauri-cli`
2. Initialize Tauri project: `cargo tauri init`
3. Configure tauri.conf.json for macOS-only builds:
   - Set `bundle.macOS.minimumSystemVersion` to appropriate version
   - Set app name to "Beanstalk"
   - Configure window defaults (minWidth: 1200, minHeight: 800)
   - Set `identifier` to `com.beanstalk.app`
4. Set up Cargo.toml with required dependencies:
   - tauri = "1.5"
   - serde = { version = "1.0", features = ["derive"] }
   - serde_json = "1.0"
   - notify = "6.0" (for file watching)
   - walkdir = "2.0" (for directory traversal)
   - yaml-rust = "0.4" (for .beans.yml parsing)
   - chrono = "0.4" (for date handling)
5. Create src-tauri/src/main.rs with basic Tauri app structure
6. Choose frontend framework (React recommended for v1) and set up package.json
7. Configure build scripts and hot-reload for development
8. Test that `cargo tauri dev` launches the app successfully
