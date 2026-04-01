---
# beanstalk-bt2x
title: Write unit tests for collectTags and filterByTags utility functions
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-04-01T16:06:08Z
updated_at: 2026-04-01T16:21:45Z
parent: beanstalk-6emn
blocked_by:
    - beanstalk-en2s
---

Implement unit tests verifying collectTags extracts unique sorted tags from bean tree, and filterByTags applies AND logic correctly for single and multiple tag filters.

## Details

Write unit tests for collectTags: test with beans containing various tags including duplicates, verify returns sorted unique tags, test empty array returns empty array, test beans with no tags returns empty array. Write unit tests for filterByTags: test single tag filtering, test multiple tags using AND logic (only beans with ALL tags pass), test empty tag array returns all beans, test empty bean array returns empty array.
