---
# beanstalk-h9hz
title: Implement get_beans and get_bean read commands
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:32:23Z
parent: beanstalk-v5m3
---

Implement read-only commands that retrieve bean data using the parser module

## Details

Implement get_beans(project_path: String) -> Result<Vec<Bean>, String> that calls the parser module to load all beans from .beans/ directory. Implement get_bean(project_path: String, bean_id: String) -> Result<Bean, String> that loads a specific bean by ID. Use proper error handling with descriptive messages for file not found, parse errors, etc. Implement get_project_info(project_path: String) -> Result<BeansConfig, String> that loads .beans/config.yml.
