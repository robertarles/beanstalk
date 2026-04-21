---
# beanstalk
title: 'FEAT: the project file browser dialogue should have a “recents” menu'
status: completed
type: task
priority: normal
created_at: 2026-04-19T20:29:54Z
updated_at: 2026-04-21T14:40:56Z
blocked_by:
    - feat-9w17
---

The project browse dialog, when adding a project to the list, should keep a last 10 history of projects in a drop down. Sorted by most recent used, Selecting from the list wil add that project.

## Summary of Changes

- Added `recent_projects: Vec<String>` to `AppConfig` (Rust + TypeScript) with `#[serde(default)]` for backward compatibility with existing config files
- `add_project` command now maintains the recents list: deduplicates, inserts the new path at index 0, truncates to 10 entries, then saves (even for paths already in the project list)
- `AddProjectDialog` shows a "Recent projects" `<select>` dropdown above the path input when recents exist; selecting an entry immediately submits it
- Sidebar and App.tsx thread `recentProjects` from `config.recent_projects`
