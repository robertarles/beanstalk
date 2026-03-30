---
# beanstalk-a5dp
title: 'Test: Implement h/l panel focus navigation'
status: completed
type: task
priority: normal
tags:
    - tm_id:2.testStrategy
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:09:01Z
parent: beanstalk-1htn
blocked_by:
    - beanstalk-jhnc
---

Unit test state transitions for moveFocusLeft/moveFocusRight verify all valid transitions and boundary guards. Test that h from sidebar stays on sidebar, l from detail stays on detail. Integration test verifies h/l keypresses update focusedPanel state and visual indicators appear on the correct panel in Layout.tsx.
