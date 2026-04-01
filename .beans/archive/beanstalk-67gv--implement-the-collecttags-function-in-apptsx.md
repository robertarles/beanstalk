---
# beanstalk-67gv
title: Implement the collectTags function in App.tsx
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:43Z
parent: beanstalk-gt0o
---

Create the collectTags function following the collectStatuses pattern, handling the bean.tags array iteration and recursive child traversal

## Details

Add the collectTags function near collectStatuses (after line 23). Implementation: function collectTags(beans: Bean[], out = new Set<string>()): string[] { for (const b of beans) { for (const tag of b.tags) { out.add(tag); } if (b.children) collectTags(b.children, out); } return [...out].sort(); }. Include JSDoc comment matching the style of collectStatuses.
