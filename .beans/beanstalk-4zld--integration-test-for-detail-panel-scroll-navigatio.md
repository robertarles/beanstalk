---
# beanstalk-4zld
title: Integration test for detail panel scroll navigation
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-b7q3
---

Write end-to-end tests verifying Ctrl+f and Ctrl+b scroll behavior in the detail panel

## Details

Create integration tests that render the full App component with keyboard navigation enabled. Test scenarios: 1) Focus detail panel and press Ctrl+f - verify scrollBy called with positive offset, 2) Press Ctrl+b - verify scrollBy called with negative offset, 3) Focus different panel (sidebar/list) and press Ctrl+f/Ctrl+b - verify no scroll occurs, 4) Verify smooth scrolling behavior is set. Use jest.spyOn to mock scrollBy and userEvent to simulate keypresses.
