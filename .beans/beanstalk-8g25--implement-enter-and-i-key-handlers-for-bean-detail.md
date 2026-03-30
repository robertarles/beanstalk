---
# beanstalk-8g25
title: Implement Enter and 'i' key handlers for bean detail panel and editor
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-njt5
---

Register tinykeys handlers for Enter (reveal/toggle bean in detail panel) and 'i' (open bean in external editor)

## Details

In useKeyboardNav hook, register tinykeys bindings:
- 'Enter': When selectedBeanId exists, call setSelectedBeanId to ensure detail panel shows the bean. May need to toggle detail panel visibility state if already selected.
- 'i': Call openBeanInEditor(projectPath, selectedBeanId) from lib/tauri.ts:47-48 when selectedBeanId is not null.

Both handlers should only execute when not focused on input/textarea/select elements (reuse existing guard logic from useKeyboardNav). The Enter key toggles visibility if bean already selected, otherwise just sets selection.
