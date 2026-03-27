---
# beanstalk-rcy1
title: Add tauri-plugin-opener dependency to Cargo.toml
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T12:51:33Z
updated_at: 2026-03-27T12:58:04Z
parent: beanstalk-fe3k
---

Add the tauri-plugin-opener crate as a dependency in src-tauri/Cargo.toml under the [dependencies] section

## Details

Open src-tauri/Cargo.toml and add `tauri-plugin-opener = "2"` to the [dependencies] section. Follow the existing pattern used by tauri-plugin-log which is already in the project. The version should match the Tauri v2 plugin ecosystem.
