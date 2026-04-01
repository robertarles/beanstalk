---
# beanstalk-bbef
title: 'Test: Implement Ctrl+f scroll down handler'
status: completed
type: task
priority: normal
tags:
    - tm_id:3.testStrategy
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:09:01Z
parent: beanstalk-b7q3
blocked_by:
    - beanstalk-21kh
---

Test that Ctrl+f only triggers when focusedPanel === 'detail'. Mock element.scrollBy and verify it's called with {top: viewportHeight/2, behavior: 'smooth'}. Test that nothing happens when scroll container is null or when a different panel is focused.
