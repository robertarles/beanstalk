---
# beanstalk-a08j
title: Implement 's' and 'y' key handlers for status cycling and clipboard
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-njt5
---

Add 's' key for cycling bean status and 'y' key for copying bean ID to clipboard with toast notification

## Details

Register two tinykeys handlers:
- 's': Get current bean status, find index in availableStatuses array (from App.tsx), increment with modulo wraparound: newIndex = (currentIndex + 1) % availableStatuses.length, call onStatusChange(selectedBeanId, newStatuses[newIndex]). Only active when selectedBeanId exists.
- 'y': Works even without selected bean (if exists, copy bean.id). Use navigator.clipboard.writeText(bean.id), then show toast via existing useToast hook with message 'Bean ID copied to clipboard'.

Both need access to availableStatuses array and toast context from App.tsx.
