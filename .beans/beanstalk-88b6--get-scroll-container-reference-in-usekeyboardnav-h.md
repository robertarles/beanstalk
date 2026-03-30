---
# beanstalk-88b6
title: Get scroll container reference in useKeyboardNav hook
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:42Z
parent: beanstalk-b7q3
---

Update useKeyboardNav hook to receive and store a reference to the BeanDetail scroll container

## Details

In src/hooks/useKeyboardNav.ts, accept the scroll container ref as a parameter or through a callback. Store this ref so it can be accessed by the scroll key handlers. This could be done by passing the ref directly to the hook, or by using a callback pattern where the hook provides a function that components call to register their scroll containers.
