---
# beanstalk-g5zh
title: Add tagFilter prop to BeanList invocation
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-04-01T16:06:07Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-a2a5
---

Insert the tagFilter={tagFilter} prop into the BeanList component's prop list

## Details

Add the line `tagFilter={tagFilter}` to the BeanList component invocation, positioning it after statusFilter and before lastRefreshed to maintain logical grouping of filter-related props. Ensure proper formatting and indentation matches the existing code style.
