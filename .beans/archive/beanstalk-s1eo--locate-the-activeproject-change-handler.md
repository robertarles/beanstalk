---
# beanstalk-s1eo
title: Locate the activeProject change handler
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:43Z
parent: beanstalk-tfnc
---

Find the useEffect or handler that resets statusFilter when activeProject changes

## Details

Search for the useEffect hook or event handler in `src/components/App.tsx` that contains `setStatusFilter([])` to reset the status filter when the active project changes. This is the location where tagFilter should also be reset.
