---
# beanstalk-e56l
title: 'Test: Set up Tauri event listener in useBeans hook'
status: todo
type: task
tags:
    - tm_id:1.testStrategy
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T18:05:43Z
parent: beanstalk-9xx8
blocked_by:
    - beanstalk-1x65
---

Test by triggering backend event and verifying loadBeans() is called. Use console.log to verify event payload is received. Test that unlisten is called on unmount to prevent memory leaks.
