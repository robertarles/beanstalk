---
# beanstalk-tr40
title: Add onTagFilter prop to Sidebar invocation
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-soyx
---

Add onTagFilter={setTagFilter} prop to enable tag filter state updates from Sidebar

## Details

In the Sidebar component invocation (around line 296), add the prop `onTagFilter={setTagFilter}` after the tagFilter prop. This passes the state setter function to Sidebar, allowing user interactions in the Sidebar to update the tag filter state in the parent App component.
