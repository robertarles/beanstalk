---
# beanstalk-b7q3
title: Implement detail panel scroll keys (Ctrl-f/Ctrl-b)
status: completed
type: epic
priority: normal
tags:
    - master
    - tm_id:8
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-27T17:04:57Z
parent: beanstalk-n9r9
blocked_by:
    - beanstalk-ndhu
---

Add Ctrl-f (scroll down half page) and Ctrl-b (scroll up half page) for detail panel

## Details

When detail panel is focused, register:
- 'Control+f': Scroll detail panel down by viewport.height / 2 using element.scrollBy({top: vh/2, behavior: 'smooth'})
- 'Control+b': Scroll detail panel up by viewport.height / 2 using element.scrollBy({top: -vh/2, behavior: 'smooth'})

Get scroll container ref from BeanDetail component. Only activate these bindings when focusedPanel === 'detail'. Note: Avoid conflicts by not using Ctrl+h/j/k/l (these conflict with browser/terminal defaults).
