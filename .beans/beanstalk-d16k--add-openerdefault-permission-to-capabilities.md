---
# beanstalk-d16k
title: Add opener:default permission to capabilities
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:58:08Z
parent: beanstalk-ytny
---

Edit the permissions array in default.json to include the opener plugin permission with URL restrictions

## Details

Modify src-tauri/capabilities/default.json to add the opener permission object after 'core:default'. The new permission should have identifier 'opener:default' with an allow array containing the URL regex pattern '^https?://.*' to restrict to HTTP/HTTPS URLs only.
