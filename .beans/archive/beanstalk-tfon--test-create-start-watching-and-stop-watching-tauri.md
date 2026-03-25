---
# beanstalk-tfon
title: 'Test: Create start_watching and stop_watching Tauri commands with lifecycle management'
status: completed
type: task
priority: normal
tags:
    - tm_id:6.testStrategy
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T20:22:35Z
parent: beanstalk-mwxa
blocked_by:
    - beanstalk-ppqk
---

Integration test: 1) Call start_watching with valid path, create bean file, verify event emitted. 2) Call stop_watching, modify bean, verify no event. 3) Call start_watching on different project, verify switches correctly. 4) Call start_watching with invalid path, verify error returned. 5) Test with directory deleted while watching, verify graceful handling.
