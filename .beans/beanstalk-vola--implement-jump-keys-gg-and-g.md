---
# beanstalk-vola
title: Implement jump keys (gg and G)
status: completed
type: epic
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-27T17:04:57Z
parent: beanstalk-n9r9
---

Add keyboard handlers for gg (jump to top) and Shift+G (jump to bottom)

## Details

In useKeyboardNav hook:
- Register 'g g' sequence (requires two 'g' presses within 500ms) to jump to first bean (index 0)
- Register 'G' (shift+g) to jump to last bean (flatBeans.length - 1)
- Use tinykeys sequence syntax: tinykeys(window, {'g g': () => jumpToTop(), 'Shift+g': () => jumpToBottom()})
- Implement timeout cleanup for pending 'g' key
- Scroll the selected bean into view after jump
