---
# beanstalk-gie7
title: Wire useKeyboardNav hook in App.tsx and pass navigation state to child components
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-clwg
---

Import and call the useKeyboardNav hook in App.tsx, destructure its state and actions, and pass the focusedPanel prop down to Layout, BeanList, BeanDetail, and Sidebar components

## Details

In App.tsx: Import useKeyboardNav from '@/hooks/useKeyboardNav'. Call the hook at the component level: const { focusedPanel, selectedBeanIndex, selectNext, selectPrevious, moveFocusLeft, moveFocusRight } = useKeyboardNav(). Pass focusedPanel prop to Layout component. Pass focusedPanel and selectedBeanIndex props to BeanList component. Pass focusedPanel prop to BeanDetail component. Pass focusedPanel prop to Sidebar component. Ensure the hook is called before any early returns in the component.
