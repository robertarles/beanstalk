---
# beanstalk-1x65
title: Set up Tauri event listener in useBeans hook
status: todo
type: task
tags:
    - master
    - tm_id:1
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T18:05:43Z
parent: beanstalk-9xx8
---

Implement event listener using @tauri-apps/api listen function to receive beans-changed events from backend

## Details

Add useEffect in useBeans hook that calls listen('beans-changed', callback) to subscribe to file change events. The callback should trigger loadBeans() to refresh the bean list. Ensure proper cleanup by returning the unlisten function. Handle async nature of listen() properly with async/await pattern.
