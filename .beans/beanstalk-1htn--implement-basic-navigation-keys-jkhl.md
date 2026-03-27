---
# beanstalk-1htn
title: Implement basic navigation keys (j/k/h/l)
status: completed
type: epic
priority: high
tags:
    - master
    - tm_id:4
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-27T16:55:19Z
parent: beanstalk-n9r9
---

Add keyboard handlers for j (next), k (previous), h (left panel), l (right panel)

## Details

In useKeyboardNav hook, register tinykeys bindings:
- 'j': calls selectNext() - increments selected bean index, wraps at end
- 'k': calls selectPrevious() - decrements selected bean index, wraps at start
- 'h': calls moveFocusLeft() - shifts focus: detail→list, list→sidebar, sidebar→no change
- 'l': calls moveFocusRight() - shifts focus: sidebar→list, list→detail, detail→no change

Ensure the bean list is flattened (respecting expand/collapse state) when calculating next/previous indices. Update visual focus indicators when panel focus changes.

## Summary of Changes\n\nWired useKeyboardNav into App.tsx; added keyboardSelectedIndex and onFlatListChange props to BeanList; added focusedPanel prop to Layout with subtle ring indicators; j/k/h/l, gg, G, and Escape all functional.
