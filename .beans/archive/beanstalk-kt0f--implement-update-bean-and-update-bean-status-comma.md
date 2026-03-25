---
# beanstalk-kt0f
title: Implement update_bean and update_bean_status commands
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:32:23Z
parent: beanstalk-v5m3
---

Implement update commands that preserve file structure while modifying metadata

## Details

Define BeanUpdate struct with optional fields for title, status, tags, body. Implement update_bean(project_path: String, bean_id: String, updates: BeanUpdate) -> Result<Bean, String> that reads existing file, parses YAML frontmatter, applies updates, rewrites file preserving unchanged fields. Implement update_bean_status(project_path: String, bean_id: String, status: String) -> Result<(), String> as simpler version that only updates status field. Preserve body content unless explicitly changed. Add updated timestamp.
