---
# beanstalk-hvu1
title: Ensure watcher restarts correctly when switching projects
status: todo
type: task
tags:
    - master
    - tm_id:5
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T18:05:43Z
parent: beanstalk-9xx8
---

Verify watcher lifecycle handles project switching: stop old watcher, start new watcher cleanly

## Details

Test that changing projectPath in state triggers useEffect cleanup (stops old watcher) before starting new watcher. Handle race conditions where stop_watching might not complete before start_watching is called. Add guards to prevent starting watcher if no project is selected. Verify no duplicate watchers run simultaneously.
