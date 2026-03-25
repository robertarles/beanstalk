---
# beanstalk-e5ce
title: Editing bean status to 'done' removes title and leaves it blank
status: completed
type: bug
priority: high
created_at: 2026-03-25T20:44:03Z
updated_at: 2026-03-25T21:28:54Z
---

When editing a bean's status to 'done' in the UI, the save operation clears the title field, resulting in a bean with a blank/missing title. The bug occurs during the status update flow when saving.

## Summary of Changes

Fixed two bugs:

1. **Status not saved from edit form** — Added `status` to the `updateBean` TypeScript params type in `src/lib/tauri.ts`, and passed `fields.status` in `handleSave` in `src/App.tsx`. Previously, editing a bean's status via the edit form silently dropped the status change.

2. **YAML title corruption** — Added a `yaml_quote_str` helper in `src-tauri/src/commands.rs` that double-quotes and escapes string values for safe YAML output. Applied it to the `title` field in both `create_bean` and `update_bean`. Titles with special YAML characters (e.g. `#`, `[`, leading colons, etc.) were being written unquoted, corrupting the frontmatter and causing `parse_bean_file` to return an empty map — making the title appear blank on the next read.
