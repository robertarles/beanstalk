---
# beanstalk-f01c
title: 'Test: Implement parse_beans_config() for .beans.yml'
status: todo
type: task
tags:
    - tm_id:4.testStrategy
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-bhh6
blocked_by:
    - beanstalk-vxr0
---

Unit tests: parse valid .beans.yml with custom statuses, parse minimal config with only name, handle missing file (returns defaults), handle invalid YAML (returns error). Verify default statuses are applied when not specified.
