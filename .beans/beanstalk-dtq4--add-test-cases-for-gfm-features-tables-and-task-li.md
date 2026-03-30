---
# beanstalk-dtq4
title: Add test cases for GFM features (tables and task lists)
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-30T13:57:15Z
updated_at: 2026-03-30T15:34:07Z
parent: beanstalk-lirh
---

Create test cases for GitHub Flavored Markdown tables and task lists with proper styling

## Details

Add test cases to src/test/components/BeanDetail.test.tsx:
1. GFM tables test: Render bean with pipe table markdown body (| Header | Header |\n|---|---|\n| Cell | Cell |), verify <table> structure with <thead>, <tbody>, <tr>, <th>, <td> elements and dark:border-gray-700 border classes
2. GFM task lists test: Render bean with '- [ ] unchecked' and '- [x] checked' body, verify <input type="checkbox"> elements with correct checked state

Use container.querySelector('table'), container.querySelectorAll('input[type="checkbox"]') to access elements.

## Summary of Changes\n\nTest cases for GFM tables and task list checkboxes added.
