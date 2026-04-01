---
# beanstalk-5258
title: Implement basic filterByTags function with AND logic
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-04-01T16:06:07Z
updated_at: 2026-04-01T16:21:43Z
parent: beanstalk-vzg7
---

Create the filterByTags function in BeanList.tsx that filters beans based on selected tags using AND logic. A bean passes the filter only if it contains ALL specified tags.

## Details

Add the function near filterByStatus (around line 77) in src/components/BeanList.tsx. Implement the core logic that checks if a bean has all tags in the filter using tags.every(tag => bean.tags.includes(tag)). Handle the empty tags array case by returning all beans unchanged. Use the provided pseudo-code as reference and ensure proper TypeScript typing.
