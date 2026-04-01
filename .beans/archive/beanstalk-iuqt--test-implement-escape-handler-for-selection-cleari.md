---
# beanstalk-iuqt
title: 'Test: Implement Escape handler for selection clearing and search input clearing'
status: completed
type: task
priority: normal
tags:
    - tm_id:5.testStrategy
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:09:01Z
parent: beanstalk-wpj0
blocked_by:
    - beanstalk-5gfk
---

Test that pressing Escape with a bean selected clears the selection. Test that pressing Escape in the search input clears the search query. Verify search input Escape handling doesn't conflict with the global Escape handler. Test the complete cascade: modal→input→edit→selection.
