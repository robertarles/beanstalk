---
# beanstalk-2z55
title: 'Test: Implement Enter and ''i'' key handlers for bean detail panel and editor'
status: completed
type: task
priority: normal
tags:
    - tm_id:1.testStrategy
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:09:01Z
parent: beanstalk-njt5
blocked_by:
    - beanstalk-8g25
---

Mock openBeanInEditor Tauri command. Test Enter key sets selectedBeanId when bean not selected. Test Enter toggles detail panel when bean already selected. Test 'i' calls openBeanInEditor with correct projectPath and selectedBeanId. Verify both keys are suppressed when inputs focused.
