---
# beanstalk-59yb
title: Verify ReactMarkdown wrapper has max-w-none class
status: todo
type: task
tags:
    - master
    - tm_id:3
created_at: 2026-03-30T13:57:15Z
updated_at: 2026-03-30T13:57:15Z
parent: beanstalk-tx5n
---

Confirm the prose class on ReactMarkdown component includes max-w-none to prevent width constraints

## Details

Examine the BeanDetail.tsx component where ReactMarkdown is rendered. Verify the className prop includes 'max-w-none' (typically part of the prose class setup like 'prose prose-sm dark:prose-invert max-w-none'). The max-w-none class ensures the prose container doesn't impose a maximum width that would prevent wide content from triggering horizontal scroll. If max-w-none is missing, add it to the className string. This is crucial for allowing tables and code blocks to expand and scroll horizontally.
