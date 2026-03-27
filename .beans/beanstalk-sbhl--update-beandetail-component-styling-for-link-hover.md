---
# beanstalk-sbhl
title: Update BeanDetail component styling for link hover states
status: todo
type: epic
priority: low
tags:
    - master
    - tm_id:10
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:35Z
parent: beanstalk-rcdr
blocked_by:
    - beanstalk-w0s4
---

Add visual feedback for link hover and active states to improve UX

## Details

Enhance the link span styling in renderBody to include hover and active states using Tailwind classes:
- Base: `text-blue-500 underline cursor-pointer`
- Hover: `hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20`
- Active: `active:text-blue-700`
- Transition: `transition-colors`

Full className example:
`text-blue-500 underline cursor-pointer hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:text-blue-700 transition-colors`

This provides clear visual feedback when users hover over or click links, improving the UX without changing core functionality.
