---
# beanstalk-j3uf
title: Register '?' key handler in useKeyboardNav hook
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-c1mf
---

Add keyboard handler for '?' key to toggle KeyboardHelp modal visibility

## Details

In src/hooks/useKeyboardNav.ts (or equivalent):
- Add isHelpOpen state (useState<boolean>(false))
- Register tinykeys handler for '?' key: tinykeys(window, {'?': () => setIsHelpOpen(prev => !prev)})
- Export isHelpOpen state and setIsHelpOpen setter
- Ensure '?' handler is not triggered when input/textarea elements are focused (check event.target)
- Return cleanup function to unregister tinykeys listener
