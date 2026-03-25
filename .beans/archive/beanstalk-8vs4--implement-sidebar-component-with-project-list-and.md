---
# beanstalk-8vs4
title: Implement Sidebar component with project list and status filters
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:35:53Z
parent: beanstalk-zcyx
---

Create Sidebar.tsx component displaying project list with active highlighting, collapsible status filter section, and add/remove project buttons

## Details

Create components/Sidebar.tsx with sections: 1) Project list displaying project names with active project highlighting (use useConfig hook to get projects and active state). 2) Collapsible status filter section with checkboxes for each status (Open, InProgress, Blocked, Done, Cancelled, Deferred). 3) Add Project and Remove Project buttons at bottom. Implement click handlers for project selection, status filter toggles, and add/remove actions. Use macOS-style sidebar styling with proper spacing and hover states. Make status filter collapsible with expand/collapse animation.
