---
# beanstalk-ts8c
title: Add visual feedback and scroll behavior for navigation
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:42Z
parent: beanstalk-1htn
---

Ensure selected bean highlighting and scrollIntoView behavior work correctly when navigation keys change the selected bean index or focused panel

## Details

Coordinate with BeanList.tsx to ensure: 1) When selectedBeanId changes via j/k navigation, the bean row is highlighted using the existing selection styles, 2) Call scrollIntoView({behavior: 'smooth', block: 'nearest'}) on the selected bean element to ensure it's visible after navigation, 3) When focusedPanel changes via h/l navigation, Layout.tsx applies visual indicators (e.g., border-2 border-blue-500 class) to the active panel. The useKeyboardNav hook should expose both selectedBeanId and focusedPanel state. BeanList needs to use a ref callback or useEffect to trigger scrollIntoView when selectedBeanId changes. Consider using data attributes (e.g., data-bean-id) on bean rows to locate the correct DOM element.
