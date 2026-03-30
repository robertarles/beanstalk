---
# beanstalk-m81h
title: Export all types and functions from keyboard.ts
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:42Z
parent: beanstalk-dymy
---

Add proper TypeScript exports for all defined types, interfaces, and helper functions

## Details

In src/types/keyboard.ts, ensure all types (FocusedPanel), interfaces (KeyboardNavState), type guards (isFocusedPanel, isKeyboardNavState), and helper functions (moveFocusLeft, moveFocusRight, updateSelectedIndex, toggleModal) are properly exported using named exports. Verify the file follows the existing project conventions seen in types/beans.ts.
