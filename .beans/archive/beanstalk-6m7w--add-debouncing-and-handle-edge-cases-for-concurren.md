---
# beanstalk-6m7w
title: Add debouncing and handle edge cases for concurrent edits
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T19:47:31Z
parent: beanstalk-9xx8
---

Debounce multiple rapid events and warn user if editing bean that gets modified externally

## Details

Implement debounce mechanism (300-500ms) to batch multiple rapid file change events (e.g., during git operations). Track which bean user is currently editing in state. When beans-changed event affects the bean being edited, show warning modal: 'This bean was modified externally. Reload or keep your changes?' If selected bean is deleted externally, clear selection. Don't overwrite form state if user has unsaved changes.
