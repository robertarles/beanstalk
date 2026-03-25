---
# beanstalk-2hva
title: 'Test: Configure development workflow and verify builds'
status: completed
type: task
priority: normal
tags:
    - tm_id:6.testStrategy
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T20:22:39Z
parent: beanstalk-ax33
blocked_by:
    - beanstalk-cbvo
---

Run `cargo tauri dev` and verify: 1) Vite server starts, 2) Tauri window opens displaying React app, 3) Making a change to frontend triggers hot-reload. Run `cargo tauri build` and verify .app bundle exists and is launchable. Open the .app from Finder and confirm it runs without errors.
