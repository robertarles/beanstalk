---
# beanstalk-4i1q
title: Implement state transition helper functions
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-dymy
---

Create pure functions for common state transitions like moving focus between panels and updating selected index

## Details

In src/types/keyboard.ts, implement helper functions: moveFocusLeft(state: KeyboardNavState): KeyboardNavState, moveFocusRight(state: KeyboardNavState): KeyboardNavState, updateSelectedIndex(state: KeyboardNavState, index: number): KeyboardNavState, and toggleModal(state: KeyboardNavState): KeyboardNavState. These pure functions return new state objects following immutable patterns.
