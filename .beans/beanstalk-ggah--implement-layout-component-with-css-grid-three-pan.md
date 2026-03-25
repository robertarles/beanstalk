---
# beanstalk-ggah
title: Implement Layout component with CSS Grid three-pane design
status: todo
type: task
tags:
    - master
    - tm_id:3
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-zcyx
---

Create Layout.tsx component using CSS Grid to establish the three-pane layout structure with 250px sidebar, flexible bean list, and detail pane. Support dark/light mode and responsive resizing.

## Details

Create components/Layout.tsx with CSS Grid layout: grid-template-columns: 250px 1fr 1fr; height: 100vh. Include slots for sidebar, bean list, and detail pane components. Implement dark/light mode support using CSS @media (prefers-color-scheme: dark) or Tauri theme API. Make layout responsive to window resizing with minimum window size of 1200x800. Apply macOS native styling conventions. Export Layout component for use in App.tsx.
