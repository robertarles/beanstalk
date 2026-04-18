---
# fix
title: 'FIX: update to an issue broke the front-matter formatting'
status: completed
type: task
priority: normal
created_at: 2026-04-18T12:39:24Z
updated_at: 2026-04-18T12:51:30Z
---

In my /Users/robert/decrypted.rra/notes/personal/ beans project I changed the parent of issue id: `P.-gjer` and the `blocked_by:` key became  part of the `tags:` line. `tags: [ ]blocked_by:`

## Summary of Changes

Fixed frontmatter corruption where `tags: []` and `blocked_by:` (or `blocking:`) were concatenated on the same line. The bug was that `tags_block` was built without a trailing newline in both `create_bean` and `update_bean`. Fixed by adding \n to `tags_block` in both functions and removing the redundant leading \n before `created_at:` in the format strings.
