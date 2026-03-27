---
# beanstalk-ngx3
title: Install @tauri-apps/plugin-opener package
status: in-progress
type: epic
priority: high
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T12:51:33Z
updated_at: 2026-03-27T12:53:50Z
parent: beanstalk-rcdr
---

Add the Tauri opener plugin to project dependencies to enable opening URLs in the system default browser

## Details

Run `npm install @tauri-apps/plugin-opener` to add the JavaScript/TypeScript bindings for the opener plugin. This plugin is the recommended Tauri v2 approach for opening URLs and files in external applications. The package provides the `openUrl()` function that will be used to open markdown links in the browser. Verify installation by checking package.json for the new dependency.
