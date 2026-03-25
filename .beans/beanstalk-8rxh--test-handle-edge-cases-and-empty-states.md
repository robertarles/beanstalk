---
# beanstalk-8rxh
title: 'Test: Handle edge cases and empty states'
status: todo
type: task
tags:
    - tm_id:5.testStrategy
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-fnbr
blocked_by:
    - beanstalk-gcjq
---

1) Delete config file, launch app, verify welcome state. 2) Remove all projects, verify empty state. 3) Manually delete project directory while app closed, restart app, verify project removed from list. 4) Set active project, restart app, verify same project active. 5) Delete active project directory while app running, verify graceful handling.
