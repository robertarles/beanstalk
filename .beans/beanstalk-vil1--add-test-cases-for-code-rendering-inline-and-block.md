---
# beanstalk-vil1
title: Add test cases for code rendering (inline and blocks)
status: todo
type: task
tags:
    - master
    - tm_id:2
created_at: 2026-03-30T13:57:15Z
updated_at: 2026-03-30T13:57:15Z
parent: beanstalk-lirh
---

Create test cases for inline code and fenced code blocks with dark mode styling verification

## Details

Add test cases to src/test/components/BeanDetail.test.tsx:
1. Inline code test: Render bean with '`code`' body, verify <code> tag with dark:bg-gray-800 and dark:text-gray-200 classes for pill styling
2. Fenced code blocks test: Render bean with triple backtick code block body, verify <pre><code> structure with dark:bg-gray-950 class for dark background

Use container.querySelector('code') and container.querySelector('pre > code') to access elements. Verify className includes expected Tailwind dark mode classes.
