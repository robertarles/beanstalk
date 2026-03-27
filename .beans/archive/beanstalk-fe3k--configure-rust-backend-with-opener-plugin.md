---
# beanstalk-fe3k
title: Configure Rust backend with opener plugin
status: completed
type: epic
priority: high
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T12:51:33Z
updated_at: 2026-03-27T12:58:04Z
parent: beanstalk-rcdr
---

Register the opener plugin in the Tauri Rust backend and configure it in src-tauri

## Details

Add `tauri-plugin-opener` to src-tauri/Cargo.toml dependencies. In src-tauri/src/lib.rs (or main.rs), register the plugin with `.plugin(tauri_plugin_opener::init())` in the Tauri builder chain. This enables the Rust backend to handle opener commands from the frontend. Typical location: in the `tauri::Builder::default()` chain before `.run()`.
