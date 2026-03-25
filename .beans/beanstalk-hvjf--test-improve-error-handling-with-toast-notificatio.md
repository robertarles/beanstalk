---
# beanstalk-hvjf
title: 'Test: Improve error handling with toast notifications and retry buttons'
status: todo
type: task
tags:
    - tm_id:6.testStrategy
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T18:05:43Z
parent: beanstalk-d6mi
blocked_by:
    - beanstalk-7hz1
---

1) Simulate error by deleting a bean file while app is open, try to update it, verify friendly error toast appears. 2) Simulate network error (if applicable), verify retry button works. 3) Test success toasts for create/update operations. 4) Verify toasts auto-dismiss after 5 seconds for non-errors. 5) Test multiple toasts stack properly.
