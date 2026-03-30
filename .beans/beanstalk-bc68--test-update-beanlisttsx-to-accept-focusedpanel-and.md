---
# beanstalk-bc68
title: 'Test: Update BeanList.tsx to accept focusedPanel and coordinate with selectedBeanIndex'
status: completed
type: task
priority: normal
tags:
    - tm_id:3.testStrategy
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:15:34Z
parent: beanstalk-clwg
blocked_by:
    - beanstalk-7169
---

Integration test: Simulate keyboard navigation (j/k keys) and verify the correct bean is highlighted in BeanList. Verify scrollIntoView is called when selectedBeanIndex changes. Verify focus indicator appears when focusedPanel is 'list'.
