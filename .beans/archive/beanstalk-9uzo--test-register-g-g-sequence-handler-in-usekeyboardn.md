---
# beanstalk-9uzo
title: 'Test: Register ''g g'' sequence handler in useKeyboardNav'
status: completed
type: task
priority: normal
tags:
    - tm_id:1.testStrategy
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:09:01Z
parent: beanstalk-vola
blocked_by:
    - beanstalk-v2kb
---

Test that pressing 'g' once does nothing. Test that pressing 'g' twice within 500ms sets selectedBeanIndex to 0. Test that pressing 'g' twice with >500ms delay does not jump to top. Mock tinykeys and verify the 'g g' binding is registered.
