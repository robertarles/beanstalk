---
# beanstalk-6jw1
title: Add test cases for lists, blockquotes, and horizontal rules
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-03-30T13:57:15Z
updated_at: 2026-03-30T15:34:06Z
parent: beanstalk-lirh
---

Create test cases for unordered lists, ordered lists, blockquotes, and horizontal rules

## Details

Add test cases to src/test/components/BeanDetail.test.tsx:
1. Unordered lists test: Render bean with '- item' body, verify <ul><li> structure
2. Ordered lists test: Render bean with '1. item' body, verify <ol><li> structure
3. Blockquotes test: Render bean with '> quote' body, verify <blockquote> element
4. Horizontal rules test: Render bean with '---' body, verify <hr> element

Use container.querySelector() to access list, blockquote, and hr elements. Verify proper nesting for list items.

## Summary of Changes\n\nTest cases for unordered/ordered lists, blockquotes, and horizontal rules added.
