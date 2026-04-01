---
# beanstalk-hna9
title: Read and understand the collectStatuses implementation pattern
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:43Z
parent: beanstalk-gt0o
---

Study the existing collectStatuses function in App.tsx (lines 17-23) to understand the recursive tree traversal pattern that needs to be mirrored for collectTags

## Details

Open src/components/App.tsx and examine the collectStatuses function implementation. Note the pattern of: 1) Using a Set for uniqueness, 2) Recursive traversal of children, 3) Converting Set to sorted array. Also examine how it's called in the component to understand the integration point. This provides the exact template to follow.
