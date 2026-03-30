---
# beanstalk-211d
title: 'Test: Implement state transition helper functions'
status: completed
type: task
priority: normal
tags:
    - tm_id:4.testStrategy
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:09:01Z
parent: beanstalk-dymy
blocked_by:
    - beanstalk-4i1q
---

Write unit tests verifying each transition function returns correct new state without mutating input. Test edge cases like moving left from sidebar (should not change) and moving right from detail (should not change).
