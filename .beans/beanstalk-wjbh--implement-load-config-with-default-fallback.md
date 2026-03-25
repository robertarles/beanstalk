---
# beanstalk-wjbh
title: Implement load_config with default fallback
status: todo
type: task
tags:
    - master
    - tm_id:3
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-lk6u
---

Create load_config() function that reads config.json, deserializes it, and returns default AppConfig if file doesn't exist

## Details

Implement load_config() -> Result<AppConfig> that: 1) Gets config file path from get_config_path(), 2) Checks if file exists, 3) If exists, reads file contents and deserializes JSON to AppConfig, 4) If file doesn't exist or deserialization fails, creates and returns default AppConfig with empty projects list and None for optional fields, 5) Creates config directory if missing using fs::create_dir_all(). Handle IO errors and JSON parsing errors with proper Result types.
