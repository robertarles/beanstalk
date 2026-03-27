---
# beanstalk-mxho
title: Test opener capability integration
status: todo
type: task
tags:
    - master
    - tm_id:5
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:34Z
parent: beanstalk-ytny
---

Verify the opener plugin works with the new capability configuration after frontend implementation

## Details

This integration test depends on Task 4 (openUrl helper) being complete. Once available, test by calling openUrl('https://example.com') from the frontend and verify: (1) the URL opens in the default system browser, (2) the WebView does not navigate, (3) javascript: URLs are blocked and do not execute.
