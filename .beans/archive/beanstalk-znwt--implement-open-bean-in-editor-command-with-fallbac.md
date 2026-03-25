---
# beanstalk-znwt
title: Implement open_bean_in_editor command with fallback chain
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:32:23Z
parent: beanstalk-v5m3
---

Implement editor launching with environment variable and platform-specific fallbacks

## Details

Implement open_bean_in_editor(file_path: String, editor: Option<String>) -> Result<(), String>. Use std::process::Command to spawn editor process. Fallback chain: 1) Use provided editor param, 2) Check EDITOR env var, 3) Use macOS default with 'open -a TextEdit <file_path>' command. Handle errors from Command execution with descriptive messages. Ensure file_path exists before attempting to open. Don't wait for editor to close (spawn detached process).
