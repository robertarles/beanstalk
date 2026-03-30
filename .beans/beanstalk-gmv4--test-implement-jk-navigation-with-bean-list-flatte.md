---
# beanstalk-gmv4
title: 'Test: Implement j/k navigation with bean list flattening'
status: completed
type: task
priority: normal
tags:
    - tm_id:1.testStrategy
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:09:01Z
parent: beanstalk-1htn
blocked_by:
    - beanstalk-5ful
---

Unit test the selectNext/selectPrevious functions with mock bean trees in various expand/collapse states. Test wrap-around at boundaries (j at last bean wraps to first, k at first bean wraps to last). Integration test with userEvent.keyboard to verify j/k keypresses update selection correctly in the rendered BeanList component.
