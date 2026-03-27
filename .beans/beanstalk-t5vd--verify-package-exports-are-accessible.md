---
# beanstalk-t5vd
title: Verify package exports are accessible
status: todo
type: task
tags:
    - master
    - tm_id:5
created_at: 2026-03-27T12:51:33Z
updated_at: 2026-03-27T12:51:33Z
parent: beanstalk-ngx3
---

Test that the openUrl function can be imported from the installed package

## Details

Run a quick TypeScript/JavaScript check to verify the package exports are accessible. This can be done by checking if `import { openUrl } from '@tauri-apps/plugin-opener'` would resolve correctly, or by examining the package's main/exports field in its package.json.
