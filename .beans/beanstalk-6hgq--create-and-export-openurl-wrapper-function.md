---
# beanstalk-6hgq
title: Create and export openUrl wrapper function
status: todo
type: task
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:34Z
parent: beanstalk-0jbw
---

Define the openUrl wrapper function that calls the underlying tauriOpenUrl function

## Details

Add the exported wrapper function after the imports: `export const openUrl = (url: string): Promise<void> => { return tauriOpenUrl(url); };`. This follows the existing pattern in tauri.ts of exporting arrow functions that wrap Tauri APIs. The function takes a URL string and returns a Promise<void>.
