---
# beanstalk-60zy
title: Implement BeanDetail component with view/edit modes and markdown rendering
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:6
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:35:53Z
parent: beanstalk-zcyx
---

Create BeanDetail.tsx component displaying bean metadata and body with toggle between read-only view (markdown rendered) and edit form mode, including Open in Editor, Save, and Cancel buttons

## Details

Create components/BeanDetail.tsx with two modes: 1) View mode - display bean metadata (title, status, tags, assignee, created/modified dates) as read-only fields, render body using react-markdown component, show Edit and Open in Editor buttons. 2) Edit mode - form inputs for all metadata fields (text input for title, dropdown for status, tag input with add/remove, assignee input, textarea for body), show Save and Cancel buttons. Implement mode toggle function. Add click handlers: Edit (switch to edit mode), Save (call update_bean Tauri command, switch to view mode), Cancel (discard changes, switch to view mode), Open in Editor (call Tauri command to open in external editor). Style with macOS form conventions.
