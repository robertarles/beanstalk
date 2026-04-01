---
# beanstalk-b9zc
title: Implement navigation action functions
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-ou7g
---

Create selectNext, selectPrevious, moveFocusLeft, moveFocusRight and other navigation actions that update state

## Details

In useKeyboardNav.ts, implement action functions using useCallback:
- selectNext(): increment selectedBeanIndex, wrap to 0 if >= flatBeans.length
- selectPrevious(): decrement selectedBeanIndex, wrap to flatBeans.length-1 if < 0
- moveFocusLeft(): shift focusedPanel (detail→list, list→sidebar, sidebar→no change)
- moveFocusRight(): shift focusedPanel (sidebar→list, list→detail, detail→no change)
- jumpToTop(): set selectedBeanIndex to 0
- jumpToBottom(): set selectedBeanIndex to flatBeans.length - 1
- Accept flatBeans array as parameter to hook for wraparound calculations
- Return all action functions in hook return object alongside navigation state
