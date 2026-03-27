---
# beanstalk-kcb8
title: Add .catch() error handler to openUrl call in onClick
status: todo
type: task
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:34Z
parent: beanstalk-66xf
---

Add a .catch() handler to the openUrl Promise in the renderBody function's onClick handler to prevent unhandled Promise rejections

## Details

In the renderBody function created in Task 6, modify the onClick handler from `onClick={() => openUrl(url)}` to `onClick={() => openUrl(url).catch((error) => console.error('Failed to open URL:', url, error))}`. This follows the existing error handling pattern used in handleOpenInEditor (BeanDetail.tsx lines 128-139).
