---
# beanstalk-wpj0
title: Implement search focus key (/) and Escape handling
status: completed
type: epic
priority: normal
tags:
    - master
    - tm_id:6
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-27T17:04:57Z
parent: beanstalk-n9r9
blocked_by:
    - beanstalk-ndhu
---

Add '/' to focus search input and Escape to exit modals/inputs

## Details

Register tinykeys handlers:
- '/': Find search input element by data-search-input attribute (already exists in BeanList.tsx:266), call .focus() on it
- 'Escape': Multi-purpose handler that:
  1. If a modal is open (check isModalOpen state), close it
  2. Else if an input/textarea has focus (document.activeElement), blur it and return focus to bean list
  3. Else if detail panel is editing (check isEditing in BeanDetail), exit edit mode
  4. Else clear bean selection

Update BeanList search input to support Escape clearing the search query.
