---
# beanstalk-odav
title: Register opener plugin in Tauri builder chain
status: todo
type: task
tags:
    - master
    - tm_id:3
created_at: 2026-03-27T12:51:33Z
updated_at: 2026-03-27T12:51:33Z
parent: beanstalk-fe3k
---

Add the .plugin(tauri_plugin_opener::init()) call to the Tauri Builder configuration

## Details

In src-tauri/src/lib.rs, locate the tauri::Builder::default() chain (around line 11) and add `.plugin(tauri_plugin_opener::init())` before the `.run()` call. Place it near the existing `.plugin(tauri_plugin_log::Builder::new().build())` call for consistency. This registers the opener plugin with the Tauri runtime.
