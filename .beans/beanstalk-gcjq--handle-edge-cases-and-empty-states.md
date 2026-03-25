---
# beanstalk-gcjq
title: Handle edge cases and empty states
status: todo
type: task
tags:
    - master
    - tm_id:5
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-fnbr
---

Implement robust handling for no projects, all projects removed, invalid paths, and app restart persistence scenarios

## Details

1) No projects on first launch: Show welcome message in sidebar with 'Add Project' button prominently. 2) All projects removed: Clear active project, show empty state in bean list ('No project selected'). 3) Invalid project paths: On app startup, validate all projects in config still exist and have .beans/ directory. Remove invalid projects from config automatically and show notification. 4) App restart: Load config on mount in App.tsx, call loadConfig() and setActiveProject(config.last_active_project) if it exists. 5) Active project deleted externally: Detect on file watcher error, remove from config, switch to another project or empty state.
