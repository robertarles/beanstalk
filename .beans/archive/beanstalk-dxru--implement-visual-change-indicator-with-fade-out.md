---
# beanstalk-dxru
title: Implement visual change indicator with fade-out
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T19:49:13Z
parent: beanstalk-9xx8
---

Add UI feedback (toast notification or row highlight) that appears when beans change externally and fades after 2 seconds

## Details

Option A: Show toast notification 'Beans updated' using a toast library or custom component. Option B: Highlight the affected bean row with subtle background color change. Implement 2-second fade-out using CSS transition or setTimeout to clear indicator. Store indicator state in component state to trigger re-render.
