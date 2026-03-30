---
# beanstalk-7169
title: Update BeanList.tsx to accept focusedPanel and coordinate with selectedBeanIndex
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:09:32Z
parent: beanstalk-clwg
blocked_by:
    - beanstalk-qwgy
---

Modify BeanList component to accept focusedPanel and selectedBeanIndex props, display focus indicator when focused, and coordinate bean selection with the keyboard navigation hook

## Details

In BeanList.tsx (397 lines): Add focusedPanel and selectedBeanIndex to props interface. Add subtle focus indicator to the list container when focusedPanel === 'list' (e.g., border-l-4 border-blue-500 or bg-blue-50 dark:bg-blue-900/20). Coordinate the selected bean highlighting: if selectedBeanIndex is provided and valid, ensure that bean is highlighted/selected in the UI. Add scrollIntoView logic to scroll the selected bean into view when selectedBeanIndex changes. Handle the flattened bean list (respecting expand/collapse state) to map selectedBeanIndex to the correct bean element.
