---
# beanstalk-w949
title: 'Test: Integration test for detail panel scroll navigation'
status: completed
type: task
priority: normal
tags:
    - tm_id:5.testStrategy
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:09:01Z
parent: beanstalk-b7q3
blocked_by:
    - beanstalk-4zld
---

Use @testing-library/react and userEvent. Mock scrollBy on the scroll container element. Render App, programmatically set focusedPanel state, simulate Ctrl+f and Ctrl+b keypresses, assert scrollBy was called with correct parameters. Test boundary cases like when detail panel is not mounted.
