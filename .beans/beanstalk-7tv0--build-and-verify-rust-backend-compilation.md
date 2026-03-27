---
# beanstalk-7tv0
title: Build and verify Rust backend compilation
status: todo
type: task
tags:
    - master
    - tm_id:5
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:34Z
parent: beanstalk-fe3k
---

Perform a full build of the Tauri Rust backend to confirm all changes compile successfully

## Details

Run `npm run build` or `cargo build --release --manifest-path src-tauri/Cargo.toml` to perform a full release build. This validates that the tauri-plugin-opener dependency is resolved, the plugin initializes correctly, and there are no type mismatches or missing features. Check for any deprecation warnings related to the plugin.
