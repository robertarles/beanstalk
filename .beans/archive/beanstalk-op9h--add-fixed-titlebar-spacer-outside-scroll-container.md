---
# beanstalk-op9h
title: Add fixed titlebar spacer outside scroll container
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-04-01T16:06:05Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-hjk7
---

Modify Sidebar.tsx to extract the titlebar spacer div to be a fixed element outside the scrollable area

## Details

In src/components/Sidebar.tsx, locate the current titlebar spacer div (the one with height: env(titlebar-area-height, 28px)). Ensure it is positioned as the first child in the main flex container with className 'flex-shrink-0' to prevent it from shrinking. This element should remain fixed at the top while content below scrolls.
