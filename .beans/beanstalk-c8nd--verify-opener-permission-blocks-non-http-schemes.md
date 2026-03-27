---
# beanstalk-c8nd
title: Verify opener permission blocks non-HTTP schemes
status: todo
type: task
tags:
    - master
    - tm_id:4
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:34Z
parent: beanstalk-ytny
---

Confirm the regex pattern correctly restricts to only HTTP and HTTPS URL schemes

## Details

Review the allow pattern '^https?://.*' to ensure it matches http:// and https:// URLs while blocking javascript:, file:, data:, and other potentially dangerous URL schemes. The caret (^) anchors to start, 's?' makes https optional, and '.*' matches the rest of the URL.
