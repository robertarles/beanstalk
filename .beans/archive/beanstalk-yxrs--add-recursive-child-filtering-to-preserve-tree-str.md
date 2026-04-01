---
# beanstalk-yxrs
title: Add recursive child filtering to preserve tree structure
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-04-01T16:06:07Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-vzg7
---

Extend the filterByTags function to recursively filter bean children and preserve the tree hierarchy by including parent beans when children match the filter.

## Details

Implement the recursive pattern that filters bean.children array recursively using filterByTags(bean.children ?? [], tags). Include a bean in the result if it has ALL selected tags OR if any of its filtered children match the filter. This preserves the tree structure by keeping parents when descendants match. Return beans with updated children property containing only filtered descendants.
