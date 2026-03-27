---
# beanstalk-swhd
title: Write edge case tests for parseBodyWithLinks
status: todo
type: task
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:34Z
parent: beanstalk-eyhw
---

Add comprehensive edge case tests covering boundary conditions, security cases, and malformed markdown syntax

## Details

Extend the test file with additional test cases for edge conditions: (1) consecutive links with no text between them, (2) link at the very start of text, (3) link at the very end of text, (4) bare URLs without markdown syntax (e.g., 'https://example.com') should NOT be parsed as links, (5) non-HTTP schemes like `[bad](javascript:alert(1))` and `[local](file:///etc/passwd)` should NOT be parsed as clickable links - treated as plain text for security, (6) malformed markdown syntax: `[text](url` missing closing paren, `text](url)` missing opening bracket, `[text(url)` missing closing bracket - all should be treated as plain text.
