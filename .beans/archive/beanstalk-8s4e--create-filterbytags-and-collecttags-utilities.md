---
# beanstalk-8s4e
title: Create filterByTags and collectTags utilities
status: completed
type: task
priority: normal
created_at: 2026-04-01T16:22:50Z
updated_at: 2026-04-01T17:05:41Z
parent: beanstalk-ghh8
---

Add two pure functions to BeanList.tsx: collectTags(beans) returns sorted unique tag values from the full bean tree; filterByTags(beans, tags) mirrors filterByStatus — recursively include a bean if it has all active tags OR any child survives. Files: src/components/BeanList.tsx
