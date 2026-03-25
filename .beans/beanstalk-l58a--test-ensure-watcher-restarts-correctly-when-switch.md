---
# beanstalk-l58a
title: 'Test: Ensure watcher restarts correctly when switching projects'
status: todo
type: task
tags:
    - tm_id:5.testStrategy
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T18:05:43Z
parent: beanstalk-9xx8
blocked_by:
    - beanstalk-hvu1
---

Integration test: Open project A, verify watcher starts. Switch to project B, verify old watcher stops and new one starts. Modify file in project A - verify no event. Modify file in project B - verify event fires. Check backend logs for duplicate watcher instances.
