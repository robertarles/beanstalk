---
# beanstalk-ndhu
title: Migrate existing keyboard shortcuts and update BeanDetail and Sidebar with focus indicators
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:15:34Z
parent: beanstalk-clwg
blocked_by:
    - beanstalk-7169
---

Integrate or remove existing keyboard shortcuts from App.tsx (lines 150-172), specifically Cmd/Ctrl+n, Cmd/Ctrl+f, and Escape handlers. Add focusedPanel prop handling to BeanDetail.tsx and Sidebar.tsx to show focus indicators

## Details

In App.tsx lines 150-172: Analyze existing keyboard handlers (Cmd+n for new bean, Cmd+f for search focus, Escape for modal close). Either integrate these into the useKeyboardNav hook or ensure they coexist without conflicts. Remove duplicate event listeners if keyboard shortcut handling is now centralized in the hook. In BeanDetail.tsx: Add focusedPanel prop, apply focus indicator styling (ring-2 ring-blue-500) when focusedPanel === 'detail'. In Sidebar.tsx: Add focusedPanel prop, apply focus indicator styling when focusedPanel === 'sidebar'. Ensure all focus indicators work in both light and dark modes.
