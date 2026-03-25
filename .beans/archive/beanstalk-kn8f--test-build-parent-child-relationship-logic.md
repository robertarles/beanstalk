---
# beanstalk-kn8f
title: 'Test: Build parent-child relationship logic'
status: completed
type: task
priority: normal
tags:
    - tm_id:6.testStrategy
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T20:25:47Z
parent: beanstalk-bhh6
blocked_by:
    - beanstalk-aq2y
---

Unit tests with fixture beans: flat structure (no relationships), nested directory structure (beans in subdirs), explicit parent_id metadata, mixed approaches, orphaned bean with invalid parent_id. Verify children vectors are correctly populated and only roots are returned.
