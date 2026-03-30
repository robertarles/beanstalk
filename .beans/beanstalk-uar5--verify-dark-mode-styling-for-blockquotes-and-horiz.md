---
# beanstalk-uar5
title: Verify dark mode styling for blockquotes and horizontal rules
status: todo
type: task
tags:
    - master
    - tm_id:4
created_at: 2026-03-30T13:57:15Z
updated_at: 2026-03-30T13:57:15Z
parent: beanstalk-5v9t
---

Confirm that blockquotes have dark:border-gray-700 for left border and horizontal rules have dark:border-gray-800

## Details

Test blockquotes and horizontal rules to verify prose-invert handles them correctly. If prose-invert doesn't provide the specified colors (gray-700 for blockquote left border, gray-800 for hr), add custom CSS overrides in src/index.css similar to the table styling. Use @apply with dark:border-gray-700 for blockquotes and dark:border-gray-800 for hr elements within the .prose class.
