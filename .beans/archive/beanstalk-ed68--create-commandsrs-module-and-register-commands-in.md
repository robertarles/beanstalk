---
# beanstalk-ed68
title: Create commands.rs module and register commands in main.rs
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:32:23Z
parent: beanstalk-v5m3
---

Set up the commands module structure and register all Tauri commands in the builder

## Details

Create src-tauri/src/commands.rs file. Add mod commands; to main.rs. In tauri::Builder, register all commands using .invoke_handler(tauri::generate_handler![get_beans, get_bean, create_bean, update_bean, update_bean_status, open_bean_in_editor, get_project_info, search_beans]). Add necessary imports for Bean, BeansConfig types from parser module.
