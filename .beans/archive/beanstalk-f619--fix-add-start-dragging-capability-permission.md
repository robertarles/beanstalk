---
# beanstalk-f619
title: 'FIX: Add start-dragging capability permission'
status: completed
type: bug
priority: normal
created_at: 2026-04-04T16:59:31Z
updated_at: 2026-04-04T17:00:08Z
---

data-tauri-drag-region calls the start_dragging command but core:window:allow-start-dragging is not in the default capabilities. Needs to be added to src-tauri/capabilities/default.json.

## Summary of Changes\n\nAdded  to . This permission is required for the  Tauri command that  calls internally. Without it, the drag command is silently denied.
