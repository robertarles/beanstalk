---
# beanstalk-1nwz
title: Add tagFilter to component destructuring with default value
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-04-01T16:06:07Z
updated_at: 2026-04-01T16:21:43Z
parent: beanstalk-pxoi
---

Include tagFilter in the BeanList component's props destructuring with a default empty array

## Details

In src/components/BeanList.tsx around line 140, update the component destructuring to include `tagFilter = []` alongside the existing statusFilter destructuring. This ensures the prop has a safe default value when not provided.
