---
# beanstalk-avtr
title: Implement 'e' key handler for inline edit mode
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:42Z
parent: beanstalk-njt5
---

Add 'e' key binding to enter inline edit mode for the selected bean in BeanDetail component

## Details

Register 'e' key in tinykeys (active only when selectedBeanId is not null):
- BeanDetail component needs either a prop callback (onEditRequested) or expose setIsEditing via ref/imperative handle
- Preferred approach: Add onEditRequested prop to BeanDetail, pass from App.tsx
- In useKeyboardNav, call onEditRequested(selectedBeanId) when 'e' pressed
- BeanDetail component handles setIsEditing(true) internally when callback fires

Ensure 'e' is guarded from input elements like other navigation keys.
