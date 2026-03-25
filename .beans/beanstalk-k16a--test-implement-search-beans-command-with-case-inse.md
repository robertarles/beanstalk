---
# beanstalk-k16a
title: 'Test: Implement search_beans command with case-insensitive matching'
status: todo
type: task
tags:
    - tm_id:6.testStrategy
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-v5m3
blocked_by:
    - beanstalk-lmx4
---

Integration tests: 1) Search for title match, verify correct beans returned. 2) Search for body content match. 3) Case-insensitive matching (search 'BEAN' finds 'bean'). 4) Empty query returns all beans. 5) No matches returns empty vec. 6) Partial word matching works.
