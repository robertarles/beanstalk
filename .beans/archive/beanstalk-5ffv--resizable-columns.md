---
# beanstalk-5ffv
title: Resizable columns
status: completed
type: feature
priority: normal
created_at: 2026-04-04T17:09:50Z
updated_at: 2026-04-04T17:11:23Z
---

Make the three-column layout resizable via drag handles between columns. Defaults: sidebar=240px, detail=400px, list=1fr.

## Summary of Changes

Changed Layout.tsx from CSS grid to flexbox layout. Added two ResizeDivider components between the columns. Each divider listens for mousedown, then attaches document-level mousemove/mouseup handlers to update sidebarWidth or detailWidth state. The list (center) column remains flex-1 and absorbs the remaining space. Removed border-r from sidebar and main (handles now serve as dividers). Limits: sidebar 150–600px, detail 200–800px.
