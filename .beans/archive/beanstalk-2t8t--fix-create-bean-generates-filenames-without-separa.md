---
# beanstalk-2t8t
title: 'Fix: create_bean generates filenames without -- separator, causing id collisions'
status: completed
type: bug
priority: high
created_at: 2026-04-10T20:53:42Z
updated_at: 2026-04-10T21:00:50Z
---

The create_bean Rust command generates bean files as `{prefix}{suffix}.md` (e.g. `beanstalk-741c.md`). The beans CLI splits filenames at the first hyphen to determine the bean id, so every file created this way gets id=`beanstalk` — they all collide and only the most-recently-updated one is visible in beans list.\n\nThe correct filename format is `{prefix}{suffix}--{title-slug}.md` (double-dash separator), so that `beanstalk-741c` becomes the full unique id rather than just `beanstalk`.\n\nFix: update create_bean in src-tauri/src/commands.rs to generate filenames as `{id}--{slug}.md` where slug is a sanitised lowercase version of the title.

## Summary of Changes

Added `make_title_slug(title: &str) -> String` helper in commands.rs that lowercases, collapses whitespace to hyphens, strips non-alphanumeric characters, and truncates to 50 chars. Updated `create_bean` to generate filenames as `{id}--{title-slug}.md` (e.g. `beanstalk-741c--add-a-priority-filter.md`) so the full id `beanstalk-741c` is the unique identifier the beans CLI sees rather than just the prefix `beanstalk`.
