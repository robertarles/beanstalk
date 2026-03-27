---
# beanstalk-jr3l
title: Verify plugin initialization order
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-27T12:51:33Z
updated_at: 2026-03-27T12:58:04Z
parent: beanstalk-fe3k
---

Ensure the opener plugin is initialized in the correct order relative to other plugins

## Details

Review the plugin chain in the Tauri builder to ensure opener is registered after core setup but before .run(). Plugin order generally doesn't matter for independent plugins like opener and log, but verify there are no runtime conflicts. The opener plugin should not depend on other plugins' initialization.
