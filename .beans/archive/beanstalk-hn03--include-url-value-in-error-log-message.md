---
# beanstalk-hn03
title: Include URL value in error log message
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:58:54Z
parent: beanstalk-66xf
---

Log the URL that failed to open alongside the error object for debugging purposes

## Details

Ensure the console.error call includes the URL as the second argument: `console.error('Failed to open URL:', url, error)`. This provides context for debugging which link failed, similar to how handleOpenInEditor logs the bean information on failure.
