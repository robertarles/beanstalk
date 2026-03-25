---
# beanstalk-54js
title: Implement Open in Editor button with backend command integration
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:39:07Z
parent: beanstalk-64k3
---

Create button that opens the bean markdown file in external editor using system command

## Details

Add Open in Editor button to view mode action buttons. On click, call open_bean_in_editor Tauri command passing bean file path. Command should use editor from app config or system default. Handle command response and show toast notification on success (Editor opened) or error (Failed to open editor: {error}). Button should be disabled during operation to prevent double-clicks.
