---
# beanstalk-ryup
title: Add tagFilter reset logic
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:43Z
parent: beanstalk-tfnc
---

Add tagFilter reset to empty array when activeProject changes

## Details

In the identified useEffect/handler from subtask 3, add `setTagFilter([])` alongside the existing `setStatusFilter([])` call. This ensures both filters are cleared when switching projects, maintaining consistent filter state.
