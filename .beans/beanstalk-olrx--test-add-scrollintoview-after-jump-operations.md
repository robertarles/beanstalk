---
# beanstalk-olrx
title: 'Test: Add scrollIntoView after jump operations'
status: completed
type: task
priority: normal
tags:
    - tm_id:4.testStrategy
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:09:01Z
parent: beanstalk-vola
blocked_by:
    - beanstalk-iy21
---

Integration test: render bean list, press 'g g', verify scrollIntoView is called on the first bean element with correct options. Test 'G' calls scrollIntoView on last bean element. Mock scrollIntoView to verify it's called. Test that scrollIntoView is not called when selectedBeanIndex doesn't change.
