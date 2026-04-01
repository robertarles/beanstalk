---
# beanstalk-k4yz
title: Create unit tests for collectTags function
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:43Z
parent: beanstalk-gt0o
---

Write comprehensive unit tests covering various tag collection scenarios including duplicates, nested children, empty arrays, and beans without tags

## Details

Create or update test file for App.tsx utilities. Test cases: 1) Empty bean array returns [], 2) Beans with no tags return [], 3) Single bean with tags returns sorted unique tags, 4) Multiple beans with duplicate tags return unique sorted tags, 5) Nested children beans have their tags collected recursively, 6) Mixed beans (some with tags, some without) work correctly. Use sample Bean objects with tags property as arrays of strings.
