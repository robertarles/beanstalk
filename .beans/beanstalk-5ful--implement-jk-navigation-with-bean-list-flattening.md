---
# beanstalk-5ful
title: Implement j/k navigation with bean list flattening
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-1htn
---

Implement j (next) and k (previous) key handlers that work with the hierarchical bean list structure, respecting expand/collapse state and implementing wrap-around behavior

## Details

In useKeyboardNav hook, implement selectNext() and selectPrevious() functions that: 1) Access the flattened bean list from BeanList.tsx's flattenVisible function (line 38) which respects the current expand/collapse state, 2) Increment/decrement the selected bean index with wrap-around (at end wrap to 0, at start wrap to length-1), 3) Update the selectedBeanId state, 4) Register tinykeys bindings for 'j' and 'k' that call these functions. The hook needs to receive the current filtered and sorted bean list as input to calculate the flat structure. Coordinate with BeanList.tsx's selectedId prop to ensure proper highlighting.
