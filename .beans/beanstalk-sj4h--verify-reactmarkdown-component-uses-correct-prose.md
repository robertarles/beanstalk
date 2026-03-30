---
# beanstalk-sj4h
title: Verify ReactMarkdown component uses correct prose classes
status: todo
type: task
tags:
    - master
    - tm_id:1
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T13:57:14Z
parent: beanstalk-8gcp
---

Confirm that the ReactMarkdown component in BeanDetail.tsx has the className 'prose prose-sm dark:prose-invert max-w-none'

## Details

Open src/components/BeanDetail.tsx and locate the ReactMarkdown component. Verify it includes the className prop with value 'prose prose-sm dark:prose-invert max-w-none'. The prose class enables typography styling, prose-sm provides compact sizing, dark:prose-invert handles dark mode colors, and max-w-none removes width restrictions for full container use.
