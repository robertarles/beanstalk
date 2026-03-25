---
# beanstalk-64k3
title: Implement bean detail view and editing
status: todo
type: epic
priority: normal
tags:
    - master
    - tm_id:9
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:43Z
parent: beanstalk-ut4w
blocked_by:
    - beanstalk-alub
    - beanstalk-7hz1
---

Create bean detail pane with metadata display, edit mode, and status management

## Details

1. Implement BeanDetail component with two modes: view and edit
2. View mode layout:
   - Title as h1
   - Status badge (styled by status)
   - Metadata grid: ID, created date, tags (as pills), assignee
   - Rendered markdown body using react-markdown
   - Action buttons: "Edit", "Open in Editor"
3. Edit mode layout:
   - Title input field
   - Status dropdown (populated from project config + defaults)
   - Tags input (comma-separated or tag chips with add/remove)
   - Assignee input
   - Body textarea (plain markdown)
   - "Save" and "Cancel" buttons
4. Implement edit mode toggle:
   - "Edit" button switches to edit mode
   - "Cancel" button reverts changes and returns to view mode
   - "Save" button calls update_bean command and returns to view mode
5. Implement status change dropdown:
   - Can be changed in view mode without entering full edit
   - Immediately saves on selection
   - Calls update_bean_status command
6. Implement "Open in Editor" button:
   - Calls open_bean_in_editor command with bean file path
   - Uses app config editor setting or defaults
   - Shows toast notification on success/error
7. Handle unsaved changes:
   - Warn user if they try to switch beans with unsaved edits
   - Provide "Save", "Discard", "Cancel" options
8. Markdown rendering:
   - Use react-markdown with safe sanitization
   - Support code blocks, lists, headers, links
   - Style to match macOS native look
