---
# beanstalk-8mol
title: 'Test: Add visual feedback and scroll behavior for navigation'
status: completed
type: task
priority: normal
tags:
    - tm_id:3.testStrategy
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:09:01Z
parent: beanstalk-1htn
blocked_by:
    - beanstalk-ts8c
---

Integration tests verify: 1) After j/k navigation, the selected bean has the correct CSS classes and is scrolled into view (mock scrollIntoView), 2) After h/l navigation, the correct panel has focus indicator styling applied, 3) Test rapid navigation (multiple j presses) ensures scrollIntoView is called for each selection change. Use @testing-library/react to query for data attributes and verify CSS classes.
