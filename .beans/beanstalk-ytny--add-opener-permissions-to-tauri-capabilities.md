---
# beanstalk-ytny
title: Add opener permissions to Tauri capabilities
status: in-progress
type: epic
priority: high
tags:
    - master
    - tm_id:3
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:53:50Z
parent: beanstalk-rcdr
---

Configure Tauri permissions to allow opening HTTP/HTTPS URLs via the opener plugin

## Details

Edit src-tauri/capabilities/default.json to add opener plugin permissions. Add permission entries that allow opening URLs matching the regex `^https?://`. Example permission config:
```json
{
  "permissions": [
    "core:default",
    {
      "identifier": "opener:default",
      "allow": [
        {"url": "^https?://.*"}
      ]
    }
  ]
}
```
This restricts the opener to only HTTP/HTTPS URLs, blocking javascript:, file:, and other schemes for security.
