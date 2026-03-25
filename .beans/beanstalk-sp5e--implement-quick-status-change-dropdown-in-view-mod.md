---
# beanstalk-sp5e
title: Implement quick status change dropdown in view mode
status: todo
type: task
tags:
    - master
    - tm_id:4
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-64k3
---

Add status dropdown in view mode that immediately saves status changes without entering full edit mode

## Details

Add status dropdown control visible in view mode (separate from edit mode). Populate dropdown with available statuses from project config + defaults. On selection change, immediately call update_bean_status Tauri command with new status. Show loading indicator during save. Update UI optimistically and revert on error. Display success/error toast notification. No need to enter edit mode for this operation.
