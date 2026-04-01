---
# beanstalk-ed41
title: Edit button layout updates
status: completed
type: feature
priority: normal
created_at: 2026-04-01T15:29:58Z
updated_at: 2026-04-01T15:31:00Z
---

Move edit buttons above bean details, reduce height, rename 'Open in Editor' to 'Edit ↗'

## Summary of Changes

- Moved Edit/Open buttons to a dedicated toolbar row **above** the title in view mode
- Reduced all button vertical padding from `py-1.5` → `py-1` (view mode, edit mode Cancel/Save, and editor button)
- Renamed 'Open in Editor' → 'Edit ↗' with the ↗ rendered at `text-[10px]`
- Updated BeanDetail test to match new button name
- All 69 tests pass
