---
# beanstalk-ixuu
title: Initialize Tauri project and configure tauri.conf.json
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:16:59Z
parent: beanstalk-ax33
---

Run cargo tauri init to scaffold the project and configure tauri.conf.json with macOS-specific settings

## Details

1. Run `cargo tauri init` in project root and answer prompts:
   - App name: Beanstalk
   - Window title: Beanstalk
   - Web assets location: ../dist (or appropriate for React)
   - Dev server URL: http://localhost:5173 (or Vite default)
2. Edit src-tauri/tauri.conf.json:
   - Set `package.productName` to "Beanstalk"
   - Set `tauri.bundle.identifier` to "com.beanstalk.app"
   - Set `tauri.bundle.macOS.minimumSystemVersion` to "10.15" or higher
   - Configure `tauri.windows[0]` with minWidth: 1200, minHeight: 800, title: "Beanstalk"
   - Disable other platform builds (Windows, Linux) if needed
