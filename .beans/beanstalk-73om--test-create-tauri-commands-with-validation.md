---
# beanstalk-73om
title: 'Test: Create Tauri commands with validation'
status: todo
type: task
tags:
    - tm_id:5.testStrategy
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-lk6u
blocked_by:
    - beanstalk-dhgw
---

Integration tests for each command: 1) get_config returns valid config, 2) save_config persists changes, 3) add_project with valid .beans/ directory succeeds and project appears in config, 4) add_project with missing .beans/ returns error, 5) remove_project removes correct project, 6) remove_project with non-existent path handles gracefully. Test error serialization to frontend.
