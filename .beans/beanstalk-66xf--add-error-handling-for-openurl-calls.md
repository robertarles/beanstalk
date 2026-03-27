---
# beanstalk-66xf
title: Add error handling for openUrl calls
status: completed
type: epic
priority: normal
tags:
    - master
    - tm_id:7
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T13:00:22Z
parent: beanstalk-rcdr
blocked_by:
    - beanstalk-w0s4
---

Implement robust error handling for failed URL opening attempts

## Details

Update the onClick handler in renderBody to catch and handle errors gracefully. When openUrl() fails (e.g., invalid URL, permissions error, system error), log the error to console and optionally show a user-facing error message. Example:
```tsx
onClick={() => {
  openUrl(url).catch((error) => {
    console.error('Failed to open URL:', url, error);
    // Optional: Show toast notification or alert
  });
}}
```
Consider whether to show visual feedback to the user (e.g., toast notification) or silently fail with console logging. For MVP, console logging is sufficient per the PRD's focus on simplicity.
