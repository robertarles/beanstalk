---
# beanstalk-duta
title: Add import statement for @tauri-apps/plugin-opener
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:58:14Z
parent: beanstalk-0jbw
---

Import the openUrl function from the opener plugin package at the top of tauri.ts

## Details

Add the import statement `import { openUrl as tauriOpenUrl } from '@tauri-apps/plugin-opener';` at the top of src/lib/tauri.ts, alongside the existing imports. Use the alias `tauriOpenUrl` to avoid naming conflicts with the wrapper function we'll export.
