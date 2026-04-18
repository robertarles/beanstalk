---
# feat
title: 'FEAT: add visual indicator of blocked_by and blocking'
status: completed
type: task
priority: normal
created_at: 2026-04-18T12:47:18Z
updated_at: 2026-04-18T12:51:35Z
---

in the list of issues, there should be a visual indication of blocked_by or blocking issues. The visual indicator should be a link, selecting the issue that is blocking or blocked_by. Use 🛑 as the visual indicator, prefix the “status” text with it if there is a blocking or blocked by value.

## Summary of Changes

Added 🛑 visual indicator in the Status column of BeanList when a bean has `blocking` or `blocked_by` relationships. The indicator is a clickable span that navigates to the first related bean (preferring `blocked_by` over `blocking`). Tooltip shows all related IDs.
