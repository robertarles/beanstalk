---
# beanstalk-key0
title: Implement Ctrl+b scroll up handler
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-b7q3
---

Register Ctrl+b keybinding that scrolls the detail panel up by half a viewport height

## Details

In useKeyboardNav hook, use tinykeys to register 'Control+b' binding. The handler should: 1) Check if focusedPanel === 'detail', 2) Get viewport height using window.innerHeight, 3) Call scrollContainerRef.current?.scrollBy({top: -window.innerHeight / 2, behavior: 'smooth'}). Only execute the scroll if the scroll container ref exists and the detail panel is focused. Note the negative value for scrolling up.
