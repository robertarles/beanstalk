---
# beanstalk-nhoe
title: Add transition-colors class for smooth state changes
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-27T12:51:35Z
updated_at: 2026-03-27T12:59:16Z
parent: beanstalk-sbhl
blocked_by:
    - beanstalk-gers
---

Add CSS transition to ensure hover and active state changes are smooth rather than instant

## Details

Add the transition-colors Tailwind class to the link span className. This utility applies a CSS transition specifically to color-related properties (color, background-color, border-color), creating a smooth 150ms transition between states rather than jarring instant changes.
