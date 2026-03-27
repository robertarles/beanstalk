---
# beanstalk-kl5j
title: 'Test: Write click interaction and security tests for links'
status: todo
type: task
tags:
    - tm_id:2.testStrategy
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:34Z
parent: beanstalk-gv96
blocked_by:
    - beanstalk-cwff
---

Run `npm test` and verify all interaction and security tests pass. Manually verify that non-HTTP links cannot trigger openUrl calls by checking mockOpenUrl.toHaveBeenCalledTimes(0) for those test cases.
