---
# beanstalk-suk8
title: 'Test: Migrate existing keyboard shortcuts and update BeanDetail and Sidebar with focus indicators'
status: completed
type: task
priority: normal
tags:
    - tm_id:4.testStrategy
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:15:55Z
parent: beanstalk-clwg
blocked_by:
    - beanstalk-ndhu
---

E2E test: Test all keyboard shortcuts work correctly: Cmd+n opens new bean modal, Cmd+f focuses search, Escape closes modals, h/l navigate between panels, j/k navigate beans. Verify no conflicts between old and new keyboard handlers. Verify focus indicators appear on all three panels (sidebar, list, detail) when navigating with h/l keys. Test in both light and dark modes.
