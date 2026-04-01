---
# beanstalk-jhnc
title: Implement h/l panel focus navigation
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-1htn
---

Implement h (left panel) and l (right panel) key handlers for navigating between sidebar, list, and detail panels with proper boundary guards

## Details

In useKeyboardNav hook, implement moveFocusLeft() and moveFocusRight() functions that: 1) Maintain focusedPanel state (one of: 'sidebar' | 'list' | 'detail'), 2) moveFocusLeft transitions: detail→list, list→sidebar, sidebar→sidebar (no change), 3) moveFocusRight transitions: sidebar→list, list→detail, detail→detail (no change), 4) Register tinykeys bindings for 'h' and 'l' keys. The hook should return the focusedPanel state so Layout.tsx can apply appropriate visual indicators (border, background color, etc.) to show which panel is active. Guard these handlers to not trigger when input/textarea/select/contenteditable elements are focused.
