---
# beanstalk-euy7
title: Integrate KeyboardHelp into App and block shortcuts while open
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:15:55Z
parent: beanstalk-c1mf
blocked_by:
    - beanstalk-ndhu
---

Mount KeyboardHelp component in App.tsx and ensure other keyboard shortcuts are blocked when help modal is open

## Details

In App.tsx:
- Import KeyboardHelp component
- Get isHelpOpen and setIsHelpOpen from useKeyboardNav hook
- Render <KeyboardHelp isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

In useKeyboardNav hook:
- Add conditional check at start of all keyboard handlers: if (isHelpOpen) return;
- This ensures no other shortcuts fire when help modal is visible
- Except Escape (which should close the modal) and '?' (which toggles it)
