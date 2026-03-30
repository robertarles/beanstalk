---
# beanstalk-xs19
title: Test jump key integration with existing navigation
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-vola
---

Write integration tests verifying gg and G work correctly with the overall keyboard navigation system

## Details

Create integration tests that verify: (1) jump keys work from different focus states (sidebar/list/detail), (2) jumping to top then using 'j' moves to second item, (3) jumping to bottom then using 'k' moves to second-to-last item, (4) jump keys work correctly with collapsed/expanded beans (flatBeans calculation), (5) jump keys don't interfere with input fields (guard check still applies).
