---
# beanstalk-7tv0
title: Build and verify Rust backend compilation
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:58:04Z
parent: beanstalk-fe3k
---

Perform a full build of the Tauri Rust backend to confirm all changes compile successfully

## Details

Run `npm run build` or `cargo build --release --manifest-path src-tauri/Cargo.toml` to perform a full release build. This validates that the tauri-plugin-opener dependency is resolved, the plugin initializes correctly, and there are no type mismatches or missing features. Check for any deprecation warnings related to the plugin.
