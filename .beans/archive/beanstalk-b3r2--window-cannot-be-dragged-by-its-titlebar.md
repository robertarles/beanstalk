---
# beanstalk-b3r2
title: Window cannot be dragged by its titlebar
status: completed
type: bug
priority: high
created_at: 2026-03-25T21:54:02Z
updated_at: 2026-03-25T22:01:47Z
---

The app window cannot be dragged/moved using the titlebar. The macOS native window drag behaviour is missing or was lost. The tauri.conf.json window configuration or the frontend CSS data-tauri-drag-region attribute may be misconfigured or absent.

## Summary of Changes\n\nAdded a 28px drag region div at the top of the Layout component with `data-tauri-drag-region` and `WebkitAppRegion: 'drag'`. Wrapped the existing grid in a flex column container so the drag region sits above the content area without disrupting the layout.
