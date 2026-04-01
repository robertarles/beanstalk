---
# beanstalk-fk5j
title: 'Test: Update existing link rendering tests for ReactMarkdown DOM structure'
status: completed
type: task
priority: normal
tags:
    - tm_id:1.testStrategy
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T15:33:13Z
parent: beanstalk-rgii
blocked_by:
    - beanstalk-o5km
---

Run `npm test BeanDetail.test.tsx` and verify all link-related tests pass. Specifically check that: (1) valid http/https links render as clickable spans with cursor-pointer class, (2) invalid scheme links render as non-clickable spans without cursor-pointer, (3) link text displays correctly without markdown syntax artifacts.

## Summary of Changes\n\nLink rendering test updated for ReactMarkdown DOM structure - getByText now queries for 'bad' instead of '[bad](javascript:xss)'.
