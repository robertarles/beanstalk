---
# beanstalk-edkr
title: Create basic main.rs with Tauri app structure
status: todo
type: task
tags:
    - master
    - tm_id:4
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-ax33
---

Set up src-tauri/src/main.rs with Tauri app builder and basic command registration structure

## Details

1. Create/edit src-tauri/src/main.rs:
```rust
#![cfg_attr(
    all(not(debug_assertions), target_os = "macos"),
    windows_subsystem = "windows"
)]

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```
2. Create src-tauri/src/lib.rs placeholder if needed for future modules
3. Ensure src-tauri/build.rs exists with basic tauri-build setup:
```rust
fn main() {
    tauri_build::build()
}
```
