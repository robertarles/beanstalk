---
# beanstalk-b875
title: 'Test: Implement quick status change dropdown in view mode'
status: todo
type: task
tags:
    - tm_id:4.testStrategy
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-64k3
blocked_by:
    - beanstalk-sp5e
---

Test status dropdown appears in view mode. Select different status, verify update_bean_status command called immediately. Verify UI updates to show new status. Test error handling with mock command failure - verify status reverts to original. Verify success toast appears.
