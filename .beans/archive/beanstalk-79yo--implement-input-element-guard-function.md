---
# beanstalk-79yo
title: Implement input element guard function
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-ou7g
---

Create the input guard utility that prevents keyboard shortcuts from triggering when user is typing in form elements

## Details

Within useKeyboardNav.ts, implement shouldHandleKeyEvent utility function:
- Check if event.target is an HTML element
- Return false if target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
- Return false if target.isContentEditable === true
- Return true otherwise to allow keyboard handling
- Use this guard at the start of all keyboard event handlers before processing shortcuts
- Add TypeScript type guard for HTMLElement to ensure type safety
