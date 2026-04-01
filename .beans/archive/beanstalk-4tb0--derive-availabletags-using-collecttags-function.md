---
# beanstalk-4tb0
title: Derive availableTags using collectTags function
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:43Z
parent: beanstalk-soyx
---

Add availableTags constant after availableStatuses (around line 163) by calling collectTags(beans)

## Details

In src/components/App.tsx, locate where availableStatuses is derived (around line 163). Immediately after that line, add: `const availableTags = collectTags(beans);`. This follows the same pattern as status collection and ensures all unique tags from the beans array are available for the Sidebar component.
