---
# beanstalk-12a7
title: 'Test: Test jump key integration with existing navigation'
status: completed
type: task
priority: normal
tags:
    - tm_id:5.testStrategy
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:09:02Z
parent: beanstalk-vola
blocked_by:
    - beanstalk-xs19
---

Integration tests using @testing-library/react: render App, simulate 'g g' sequence with userEvent, verify first bean is selected and scrolled. Test Shift+G jumps to last bean. Test jump then navigate with j/k. Test with expanded/collapsed parent beans. Test that jump keys are blocked when input element is focused.
