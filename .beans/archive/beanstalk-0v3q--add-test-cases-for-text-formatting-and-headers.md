---
# beanstalk-0v3q
title: Add test cases for text formatting and headers
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T15:34:06Z
parent: beanstalk-lirh
---

Create test cases for headers (h1-h3), bold, italic, and strikethrough markdown rendering

## Details

Add test cases to src/test/components/BeanDetail.test.tsx:
1. Headers test: Render bean with '## Heading' body, verify <h2> element exists with dark:text-gray-100 class
2. Bold test: Render bean with '**bold**' body, verify <strong> tag exists
3. Italic test: Render bean with '*italic*' body, verify <em> tag exists
4. Strikethrough test: Render bean with '~~text~~' body, verify <del> tag exists

Each test should use render() from @testing-library/react, pass a mock bean with the markdown body, and use screen.getByRole() or container.querySelector() to verify element presence.

## Summary of Changes\n\nTest cases for text formatting (bold, italic, strikethrough) and headers (h1, h2) added.
