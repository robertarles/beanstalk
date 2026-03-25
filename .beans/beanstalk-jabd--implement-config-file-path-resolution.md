---
# beanstalk-jabd
title: Implement config file path resolution
status: todo
type: task
tags:
    - master
    - tm_id:2
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-lk6u
---

Implement platform-specific config directory resolution using Tauri API to locate ~/Library/Application Support/Beanstalk/config.json

## Details

Create a function get_config_path() that uses tauri::api::path::app_config_dir() to get the platform-specific application support directory, then appends 'Beanstalk/config.json' to construct the full config file path. Handle the case where app_config_dir() returns None by providing a fallback or returning an error. Ensure the directory path is created if it doesn't exist.
