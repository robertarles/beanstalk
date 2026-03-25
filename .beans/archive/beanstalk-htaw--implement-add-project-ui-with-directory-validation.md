---
# beanstalk-htaw
title: Implement Add Project UI with directory validation
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:39:31Z
parent: beanstalk-fnbr
---

Build UI component with button and Tauri dialog integration for adding new bean projects, including validation for .beans/ directory presence

## Details

Add 'Add Project' button to Sidebar component. On click, use Tauri's dialog.open({ directory: true }) API to show native directory picker. When directory selected, validate it contains .beans/ subdirectory by attempting to read .beans/beans.yml or checking directory existence. If invalid, show error toast/message ('Selected directory is not a valid beans project'). If valid, call addProject(path) from useConfig hook. Update sidebar project list to show new project. Handle cancellation (user closes dialog without selecting).
