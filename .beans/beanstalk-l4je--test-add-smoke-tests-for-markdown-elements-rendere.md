---
# beanstalk-l4je
title: 'Test: Add smoke tests for markdown elements rendered by ReactMarkdown'
status: todo
type: task
tags:
    - tm_id:2.testStrategy
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T13:57:14Z
parent: beanstalk-rgii
blocked_by:
    - beanstalk-5xpx
---

Run `npm test BeanDetail.test.tsx` and verify all new smoke tests pass. Confirm that ReactMarkdown correctly renders: headers with proper semantic tags, bold/italic with appropriate tags, inline code with styling classes, code blocks with pre/code structure, lists with proper list semantics, GFM tables with complete table structure, and GFM task checkboxes as readonly inputs.
