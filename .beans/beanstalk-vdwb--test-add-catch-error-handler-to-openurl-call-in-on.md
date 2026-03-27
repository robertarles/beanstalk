---
# beanstalk-vdwb
title: 'Test: Add .catch() error handler to openUrl call in onClick'
status: completed
type: task
priority: normal
tags:
    - tm_id:1.testStrategy
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:59:19Z
parent: beanstalk-66xf
blocked_by:
    - beanstalk-kcb8
---

Click on a link with an intentionally malformed URL (e.g., one that passes regex but fails at OS level) and verify the error is logged to console without crashing the app
