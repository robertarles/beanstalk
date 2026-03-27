---
# beanstalk-eyhw
title: Write unit tests for markdown link parser
status: todo
type: epic
priority: normal
tags:
    - master
    - tm_id:8
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:35Z
parent: beanstalk-rcdr
blocked_by:
    - beanstalk-7yu7
---

Create comprehensive unit tests for the link parsing logic

## Details

Create a test file `src/test/lib/markdown.test.ts` (or co-locate in BeanDetail.test.tsx) with Vitest test cases covering:
1. Empty string input
2. Plain text with no links
3. Single link in middle of text
4. Multiple links
5. Consecutive links with no text between
6. Link at start of text
7. Link at end of text
8. Bare URLs (should NOT be parsed as links)
9. Non-HTTP schemes: `[bad](javascript:alert(1))`, `[local](file:///etc/passwd)`
10. Malformed markdown: `[text](url`, `text](url)`, `[text(url)`

Use `describe` and `it` blocks following the existing test patterns in the codebase (see BeanList.test.tsx as example).
