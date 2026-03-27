---
# beanstalk-cvid
title: Test openUrl function in running application
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:58:14Z
parent: beanstalk-0jbw
---

Manually verify that openUrl opens URLs in the system default browser

## Details

In the running Tauri app, import and call openUrl('https://example.com') either via browser console, a test button, or by temporarily adding a test call. Verify that the URL opens in the system default browser (not in the WebView). The WebView should remain unchanged after the call.
