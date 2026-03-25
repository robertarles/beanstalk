---
# beanstalk-95zc
title: Implement Cancel button and keyboard shortcuts (Cmd+N, Escape)
status: todo
type: task
tags:
    - master
    - tm_id:5
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T18:05:43Z
parent: beanstalk-rc33
---

Add Cancel functionality to close form without saving, implement Cmd+N shortcut to open New Bean form, and Escape to cancel/close the form

## Details

1. Add Cancel button next to Save button in form
2. Wire Cancel button to close form and discard any entered data
3. Show confirmation dialog if form has unsaved changes (optional but recommended)
4. Implement global keyboard listener for Cmd+N to open New Bean form
5. Implement Escape key handler to cancel/close form when form is active
6. Ensure keyboard shortcuts don't conflict with other app shortcuts
7. Add visual indicators for keyboard shortcuts (e.g., tooltip showing 'Cmd+N')
8. Clean up event listeners on component unmount
