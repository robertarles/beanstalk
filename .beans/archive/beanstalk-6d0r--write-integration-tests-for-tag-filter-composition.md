---
# beanstalk-6d0r
title: Write integration tests for tag filter composition with status and search filters
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-04-01T16:06:08Z
updated_at: 2026-04-01T16:21:44Z
parent: beanstalk-6emn
blocked_by:
    - beanstalk-6b3f
---

Implement tests verifying tag filter works correctly when combined with status filter and search filter, testing all three filters working together.

## Details

Create integration tests that render the full component tree or use higher-level test fixtures. Test: tag filter + status filter together (beans must match both filters), tag filter + search filter together (beans must match tags AND search text), all three filters together (tag + status + search), verify filters are independent (changing one doesn't break others), verify clearing one filter doesn't affect others. Use realistic bean fixtures with varied tags, statuses, and titles/descriptions.
