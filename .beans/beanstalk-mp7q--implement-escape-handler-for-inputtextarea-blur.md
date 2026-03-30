---
# beanstalk-mp7q
title: Implement Escape handler for input/textarea blur
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-wpj0
---

Add second level of Escape handling to blur focused inputs and return focus to bean list

## Details

In the Escape handler cascade, after checking for open modals, check if document.activeElement is an input, textarea, or other focusable form element. If true: 1) Call `.blur()` on document.activeElement, 2) Return focus to the bean list container (query for the list element and call .focus() on it). This ensures users can quickly exit form fields and return to navigating beans with keyboard shortcuts.
