---
# beanstalk-4ypx
title: Write end-to-end workflow tests for complete user interactions
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-04-01T16:06:08Z
updated_at: 2026-04-01T16:21:44Z
parent: beanstalk-6emn
blocked_by:
    - beanstalk-6d0r
---

Implement tests for complete workflows including tree preservation, project switching tag filter reset, scrolling with many tags, and full user journey from tag selection to filtered results.

## Details

Write end-to-end tests covering: tree preservation (beans with matching children are included even if parent doesn't match tags), project switching resets tagFilter to empty array, sidebar scrolls when many tags/projects exceed window height, complete user workflow (load project → see tags → select tags → verify filtered beans → switch project → verify filter reset). These tests should exercise the full component tree and verify state management across component boundaries.
