---
# beanstalk-njt5
title: Implement bean action keys (Enter, i, e, n, s, y)
status: completed
type: epic
priority: high
tags:
    - master
    - tm_id:7
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-27T17:04:57Z
parent: beanstalk-n9r9
blocked_by:
    - beanstalk-ndhu
---

Add keyboard shortcuts for bean-specific actions when a bean is selected

## Details

Register tinykeys handlers (only active when selectedBeanId is not null):
- 'Enter': Open/reveal bean in detail panel (if not already selected, or toggle detail panel visibility)
- 'i': Call openBeanInEditor(projectPath, selectedBeanId) to open in $EDITOR
- 'e': Enter inline edit mode for selected bean (set isEditing=true in BeanDetail)
- 'n': Open 'New Bean' create form (call onNewBean callback, clear selection)
- 's': Cycle status forward - get current status index in availableStatuses array, increment (wrap to 0 at end), call onStatusChange with new status
- 'y': Copy bean ID to clipboard using navigator.clipboard.writeText(bean.id), show toast notification

Ensure 'n' and 'y' work even without a selected bean.
