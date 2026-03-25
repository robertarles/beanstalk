---
# beanstalk-jb2h
title: 'Test: Add loading states and empty states with helpful messages'
status: completed
type: task
priority: normal
tags:
    - tm_id:5.testStrategy
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T20:23:56Z
parent: beanstalk-d6mi
blocked_by:
    - beanstalk-alub
---

1) Launch app with no projects, verify empty state with "Add a project" message. 2) Add project with no beans, verify "Create your first bean" message. 3) Search for non-existent term, verify "No beans match" message. 4) Trigger bean load, verify skeleton loaders appear briefly. 5) Create bean, verify Save button shows spinner.
