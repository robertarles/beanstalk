---
# beanstalk-rx0w
title: Add tagFilter prop to Sidebar invocation
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:43Z
parent: beanstalk-soyx
---

Add tagFilter={tagFilter} prop to the Sidebar component at the identified location

## Details

In the Sidebar component invocation (around line 296), add the new prop `tagFilter={tagFilter}` after the existing statusFilter-related props. This passes the current tag filter state from App.tsx to the Sidebar component, enabling tag filtering functionality.
