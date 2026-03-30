---
# beanstalk-lirh
title: Add comprehensive markdown rendering integration tests
status: todo
type: epic
priority: normal
tags:
    - master
    - tm_id:7
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T13:57:16Z
parent: beanstalk-64n0
blocked_by:
    - beanstalk-rgii
---

Create additional test cases covering all markdown features mentioned in PRD

## Details

Add new test cases to src/test/components/BeanDetail.test.tsx:

1. Headers (h1-h3): Verify `## Heading` renders as <h2> element
2. Bold: Verify `**bold**` renders with <strong> tag
3. Italic: Verify `*italic*` renders with <em> tag
4. Strikethrough (GFM): Verify `~~text~~` renders with <del> tag
5. Inline code: Verify `` `code` `` renders with <code> and background pill styling
6. Fenced code blocks: Verify triple backticks render as <pre><code> with dark background
7. Unordered lists: Verify `- item` renders as <ul><li>
8. Ordered lists: Verify `1. item` renders as <ol><li>
9. Blockquotes: Verify `> quote` renders as <blockquote>
10. Horizontal rules: Verify `---` renders as <hr>
11. GFM tables: Verify pipe tables render with <table> structure and borders
12. GFM task lists: Verify `- [ ]` and `- [x]` render with checkbox inputs
13. Multiple links: Verify multiple markdown links in body all work correctly
14. Mixed content: Verify body with headers, lists, code, and links all render together

Each test should verify both element presence and appropriate dark mode styling.
