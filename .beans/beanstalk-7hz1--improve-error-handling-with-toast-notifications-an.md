---
# beanstalk-7hz1
title: Improve error handling with toast notifications and retry buttons
status: todo
type: task
priority: normal
tags:
    - master
    - tm_id:6
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T18:05:43Z
parent: beanstalk-d6mi
blocked_by:
    - beanstalk-ynu2
---

Add non-blocking toast notifications for errors with friendly messages and retry functionality where applicable

## Details

1. Install toast notification library (e.g., react-hot-toast, sonner) or build simple custom toast component
2. Create ToastProvider in App.tsx to manage toast state
3. Wrap all Tauri command calls with try-catch:
   - On error, show toast with user-friendly message (not raw error)
   - Map common errors to helpful messages:
     - File not found: "Could not find bean file. It may have been deleted."
     - Permission denied: "Permission denied. Check file permissions."
     - Invalid data: "Invalid bean data. Please check the format."
4. Add retry buttons to toasts for recoverable errors:
   - Network/file system errors: Show "Retry" button that re-invokes the failed command
   - Timeout errors: Allow user to retry the operation
5. Position toasts in top-right corner, auto-dismiss after 5 seconds unless error (keep error toasts until dismissed)
6. Add toast types: success (green), error (red), info (blue)
