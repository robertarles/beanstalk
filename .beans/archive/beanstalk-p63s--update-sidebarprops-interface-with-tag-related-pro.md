---
# beanstalk-p63s
title: Update SidebarProps interface with tag-related props
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:44Z
parent: beanstalk-3nce
---

Add three new props to the SidebarProps interface: tagFilter (string[]), onTagFilter ((tags: string[]) => void), and tags (string[] of available tags)

## Details

In src/components/Sidebar.tsx, locate the SidebarProps interface and add the following properties:
- tagFilter: string[] - array of currently selected tags
- onTagFilter: (tags: string[]) => void - callback to update tag filter
- tags: string[] - array of all available tags from the active project

This mirrors the existing pattern used for statusFilter and onStatusFilter props.
