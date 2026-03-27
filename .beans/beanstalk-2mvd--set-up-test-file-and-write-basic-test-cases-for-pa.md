---
# beanstalk-2mvd
title: Set up test file and write basic test cases for parseBodyWithLinks
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:58:54Z
parent: beanstalk-eyhw
---

Create src/test/lib/markdown.test.ts following existing patterns (see BeanList.test.tsx) and write tests for basic parsing scenarios

## Details

Create the test file at src/test/lib/markdown.test.ts with proper imports (describe, it, expect from 'vitest'). Import parseBodyWithLinks from the lib module. Write test cases in describe/it blocks for: (1) empty string input returns empty array or single empty text segment, (2) plain text with no links returns single text segment with full content, (3) single markdown link in middle of text returns [text, link, text] segments with correct type tags, (4) multiple links returns correctly ordered segments with proper text/link/text/link/text structure.
