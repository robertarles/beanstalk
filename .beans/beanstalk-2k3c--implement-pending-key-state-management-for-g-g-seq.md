---
# beanstalk-2k3c
title: Implement pending key state management for 'g g' sequence
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-ou7g
---

Add state tracking and timeout handling for multi-key sequences like 'g g' using useRef and setTimeout

## Details

In useKeyboardNav.ts:
- Add useRef<NodeJS.Timeout | null>(null) to track pending timeout for 'g' key
- Add useState<boolean>(false) to track if first 'g' was pressed (pendingGKey)
- Implement handleFirstG function: sets pendingGKey=true, starts 500ms timeout that resets pendingGKey to false
- Implement handleSecondG function: checks if pendingGKey is true, if so executes jump-to-top action and clears timeout
- Clear timeout in cleanup function to prevent memory leaks
- Use useCallback for timeout handlers to avoid recreating functions
- Store timeout ID in ref to allow cleanup
