---
# beanstalk-ou7g
title: Implement useKeyboardNav hook
status: completed
type: epic
priority: high
tags:
    - master
    - tm_id:3
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-27T16:55:14Z
parent: beanstalk-n9r9
---

Create a React hook that manages keyboard navigation state and registers tinykeys handlers

## Details

Create src/hooks/useKeyboardNav.ts that:
- Uses tinykeys to register handlers on document
- Guards input elements (checks event.target for input/textarea/select/contenteditable)
- Manages focused panel state (sidebar/list/detail)
- Tracks selected bean index
- Handles pending key state for 'g g' sequence with ~500ms timeout
- Returns navigation state and action functions (selectNext, selectPrevious, moveFocusLeft, moveFocusRight, etc.)
- Cleans up tinykeys subscriptions on unmount

Implement the input guard as: `if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable) return;`

## Summary of Changes\n\nCreated src/hooks/useKeyboardNav.ts implementing the full keyboard navigation hook with tinykeys, input guard, panel focus state, selectedBeanIndex, g-g sequence with 500ms timeout, escape handler chain with priority ordering, and clean unmount.
