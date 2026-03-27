---
# beanstalk-t0ln
title: 'Test: Implement parseBodyWithLinks function with regex parsing'
status: todo
type: task
tags:
    - tm_id:2.testStrategy
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:34Z
parent: beanstalk-dypj
blocked_by:
    - beanstalk-137w
---

Write unit tests in `src/test/lib/markdown.test.ts` covering: (1) empty string returns [], (2) plain text returns single text segment, (3) single link returns [text, link, text] or [link, text] or [text, link], (4) multiple links parsed correctly, (5) consecutive links without text between, (6) non-HTTP URLs like javascript: or file: treated as plain text, (7) malformed markdown syntax (missing bracket/paren) treated as plain text.
