---
# beanstalk-c1mf
title: Add keybindings help overlay (?)
status: completed
type: epic
priority: low
tags:
    - master
    - tm_id:9
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-27T17:09:53Z
parent: beanstalk-n9r9
blocked_by:
    - beanstalk-njt5
    - beanstalk-b7q3
---


## Summary of Changes
- Created src/components/KeyboardHelp.tsx: modal overlay with semi-transparent backdrop, keybindings table grouped by Global / Bean Actions / Detail Panel sections, styled with Tailwind dark-mode patterns matching AddProjectDialog
- Added '?' binding to useKeyboardNav.ts that toggles isModalOpen state
- Added isModalOpen guards to all other key bindings (j/k/h/l/g/G///i/e/n/s/y/Ctrl-f/Ctrl-b) so they are suppressed while the help overlay is open
- Wired KeyboardHelp into App.tsx: destructured isModalOpen and setIsModalOpen from useKeyboardNav, rendered component with onClose handler
