---
# beanstalk-9mb5
title: 'Test: Register ''Shift+G'' handler in useKeyboardNav'
status: completed
type: task
priority: normal
tags:
    - tm_id:2.testStrategy
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:09:02Z
parent: beanstalk-vola
blocked_by:
    - beanstalk-33xy
---

Test that pressing Shift+G sets selectedBeanIndex to the last index (flatBeans.length - 1). Verify with empty list (length 0) that index is set to -1. Mock tinykeys and verify the 'Shift+g' binding is registered correctly.
