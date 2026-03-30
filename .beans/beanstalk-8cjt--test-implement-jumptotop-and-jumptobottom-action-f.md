---
# beanstalk-8cjt
title: 'Test: Implement jumpToTop and jumpToBottom action functions'
status: completed
type: task
priority: normal
tags:
    - tm_id:3.testStrategy
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:09:01Z
parent: beanstalk-vola
blocked_by:
    - beanstalk-tcsh
---

Unit test jumpToTop sets index to 0. Unit test jumpToBottom sets index to flatBeans.length - 1. Test with different flatBeans lengths (0, 1, 5, 100). Verify the functions are returned from the hook and accessible to consumers.
