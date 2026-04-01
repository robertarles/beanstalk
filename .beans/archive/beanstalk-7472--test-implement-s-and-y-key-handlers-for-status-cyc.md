---
# beanstalk-7472
title: 'Test: Implement ''s'' and ''y'' key handlers for status cycling and clipboard'
status: completed
type: task
priority: normal
tags:
    - tm_id:4.testStrategy
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:09:01Z
parent: beanstalk-njt5
blocked_by:
    - beanstalk-a08j
---

Mock navigator.clipboard.writeText and useToast hook. Test 's' cycles through all statuses in availableStatuses array and wraps to first. Test 's' calls onStatusChange with correct status. Test 'y' copies bean ID and shows toast. Test 'y' works with and without selected bean. Verify both suppressed when inputs focused.
