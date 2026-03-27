---
# beanstalk-ds3g
title: 'Test: Verify opener permission blocks non-HTTP schemes'
status: todo
type: task
tags:
    - tm_id:4.testStrategy
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:34Z
parent: beanstalk-ytny
blocked_by:
    - beanstalk-c8nd
---

Test regex pattern against sample URLs: https://example.com (should match), http://test.org (should match), javascript:alert(1) (should not match), file:///etc/passwd (should not match)
