---
# beanstalk-xxdi
title: Add tagFilter to BeanListProps interface
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-04-01T16:06:07Z
updated_at: 2026-04-01T16:21:43Z
parent: beanstalk-pxoi
---

Add the optional tagFilter prop to the BeanListProps interface in src/components/BeanList.tsx

## Details

In src/components/BeanList.tsx around line 4, add `tagFilter?: string[];` to the BeanListProps interface. This follows the exact same pattern as the existing statusFilter prop.
