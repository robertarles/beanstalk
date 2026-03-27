---
# beanstalk-g8s4
title: 'Test: Write edge case tests for parseBodyWithLinks'
status: completed
type: task
priority: normal
tags:
    - tm_id:2.testStrategy
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:59:19Z
parent: beanstalk-eyhw
blocked_by:
    - beanstalk-swhd
---

Run `npm test -- src/test/lib/markdown.test.ts` to verify all edge case tests pass. Security-related tests (non-HTTP schemes) should verify these are NOT returned as link segments. Malformed syntax tests should verify graceful degradation to plain text segments.
