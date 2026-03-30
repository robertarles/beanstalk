---
# beanstalk-36fs
title: Add test cases for links and mixed content
status: todo
type: task
tags:
    - master
    - tm_id:5
created_at: 2026-03-30T13:57:15Z
updated_at: 2026-03-30T13:57:15Z
parent: beanstalk-lirh
---

Create test cases for multiple markdown links and complex documents with mixed markdown features

## Details

Add test cases to src/test/components/BeanDetail.test.tsx:
1. Multiple links test: Render bean with body containing multiple markdown links '[Link1](http://example.com) and [Link2](https://example.org)', verify both <a> elements exist with correct href attributes and dark:hover:bg-blue-900/20 styling
2. Mixed content test: Render bean with complex body containing headers, lists, code blocks, and links together, verify all element types render correctly and coexist without layout issues

Use screen.getAllByRole('link') or container.querySelectorAll('a') to access links. For mixed content, verify multiple element types with separate querySelector calls.
