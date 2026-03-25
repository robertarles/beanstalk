---
# beanstalk-wizg
title: Implement all keyboard shortcuts with proper event handling
status: todo
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T18:05:43Z
parent: beanstalk-d6mi
blocked_by:
    - beanstalk-ynu2
---

Add global keyboard shortcuts (Cmd+N, Cmd+F, Cmd+E, Escape, arrows, Enter, Cmd+O, Cmd+W) across the application

## Details

1. Install keyboard event handling library or use native React onKeyDown
2. Implement shortcuts in App.tsx with useEffect:
   - Cmd+N: Trigger new bean form (dispatch action or call handler)
   - Cmd+F: Focus search input (use ref.current.focus())
   - Cmd+E: Edit selected bean (if one is selected)
   - Escape: Cancel edit mode or close dialogs (check current state)
   - Up/Down arrows: Navigate bean list (move selection, scroll into view)
   - Enter: Open selected bean in detail pane
   - Cmd+O: Open selected bean in external editor (invoke Tauri command)
   - Cmd+W: Close window (Tauri's default, ensure not prevented)
3. Prevent default browser shortcuts where needed (e.g., Cmd+F)
4. Add keyboard shortcut hints to UI (tooltips, menu bar if implemented)
5. Ensure shortcuts work globally except when typing in input/textarea
