---
# beanstalk-apdp
title: Implement Escape handler for modal closure
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-wpj0
---

Add first level of Escape key handling to close modals when isModalOpen state is true

## Details

Register a tinykeys handler for 'Escape' key that checks the isModalOpen state (already tracked in App.tsx). If isModalOpen is true, call the closeModal function to dismiss the active modal. This is the highest priority Escape action in the cascade. Reference the existing Escape handling pattern in App.tsx lines 162-167 for implementation guidance. Ensure this check happens before any other Escape behaviors.
