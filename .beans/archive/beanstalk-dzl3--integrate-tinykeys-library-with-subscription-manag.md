---
# beanstalk-dzl3
title: Integrate tinykeys library with subscription management
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-ou7g
---

Set up tinykeys registration on document with proper cleanup in useEffect to handle keyboard event subscriptions

## Details

In useKeyboardNav.ts:
- Import tinykeys from 'tinykeys' library
- Create useEffect that runs once on mount to register tinykeys handlers on document
- Initialize empty tinykeys bindings object (will be populated in later tasks)
- Store unsubscribe function returned by tinykeys() call
- Return cleanup function in useEffect that calls unsubscribe to remove all keyboard listeners
- Ensure tinykeys handlers call shouldHandleKeyEvent guard before processing
- Test that subscriptions are properly cleaned up on unmount to prevent memory leaks
