---
# beanstalk-rc33
title: Implement bean creation workflow
status: completed
type: epic
priority: normal
tags:
    - master
    - tm_id:10
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T19:48:11Z
parent: beanstalk-ut4w
blocked_by:
    - beanstalk-alub
    - beanstalk-7hz1
---

Build UI and logic for creating new beans with form validation and file generation

## Details

1. Add "New Bean" button to BeanList component (bottom or top toolbar)
2. Create NewBeanForm component (can reuse BeanDetail edit mode)
3. Form fields:
   - Title (required, text input)
   - Status (dropdown, default to "open" or first status from config)
   - Tags (tag input, optional)
   - Assignee (text input, optional)
   - Body (textarea, optional)
4. Implement form validation:
   - Title is required and non-empty
   - Show validation errors inline
   - Disable Save button until valid
5. Implement form submission:
   - Call create_bean command with form data
   - Generate unique ID on backend
   - Create .md file in .beans/ directory
   - On success: close form, select newly created bean, refresh bean list
   - On error: show error message, keep form open
6. Two UX options (choose one):
   - Option A: Show form in detail pane (replace detail view)
   - Option B: Modal dialog overlay
7. Implement Cancel button to close form without saving
8. Consider keyboard shortcuts: Cmd+N for new bean, Escape to cancel
9. After creation, automatically select the new bean in the list
10. Ensure file watcher picks up new bean and updates list if not already refreshed
