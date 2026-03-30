---
# beanstalk-zdcm
title: Add dark mode styles for table borders
status: todo
type: task
tags:
    - master
    - tm_id:3
created_at: 2026-03-30T13:57:15Z
updated_at: 2026-03-30T13:57:15Z
parent: beanstalk-5v9t
---

Implement dark:border-gray-700 styling for table elements including table, th, and td borders

## Details

Add custom CSS overrides in src/index.css within a @media (prefers-color-scheme: dark) block. Target .prose table, .prose th, and .prose td elements with dark border-gray-700 styling using Tailwind's @apply directive. Ensure this works in conjunction with prose-invert class. The table component override in BeanDetail.tsx may also need dark:border-gray-700 added to the className if not handled by CSS.
