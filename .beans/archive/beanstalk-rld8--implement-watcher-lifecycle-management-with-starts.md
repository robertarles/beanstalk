---
# beanstalk-rld8
title: Implement watcher lifecycle management with start/stop commands
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T19:47:31Z
parent: beanstalk-9xx8
---

Call start_watching command when project loads and stop_watching on unmount or project switch

## Details

Add useEffect that depends on projectPath to call invoke('start_watching', {path: projectPath}) when project is selected. Return cleanup function that calls invoke('stop_watching') to ensure watcher stops when component unmounts or projectPath changes. Handle errors if watcher fails to start.
