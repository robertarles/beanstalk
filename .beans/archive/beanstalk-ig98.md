---
# beanstalk
title: 'Feature: default to selecting status “Todo”, “In-Progress” and “Draft”'
status: completed
type: task
priority: normal
created_at: 2026-04-06T17:53:53Z
updated_at: 2026-04-10T16:42:25Z
---

Feature: default to selecting status “Todo”, “In-Progress” and “Draft” on initial viewing of a project (first view on opening the app)

## Summary of Changes

- Initialized `statusFilter` state in App.tsx with `['todo', 'in-progress', 'draft']` instead of an empty array
- Updated `handleSelectProject` to reset to those same defaults when switching projects, rather than clearing the filter
