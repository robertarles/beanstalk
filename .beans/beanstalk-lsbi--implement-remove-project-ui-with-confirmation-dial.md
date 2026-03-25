---
# beanstalk-lsbi
title: Implement Remove Project UI with confirmation dialog
status: todo
type: task
tags:
    - master
    - tm_id:3
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-fnbr
---

Add delete/remove functionality for projects in sidebar with confirmation dialog and logic to handle active project removal

## Details

Add delete icon/button next to each project in sidebar project list. On click, show confirmation dialog ('Are you sure you want to remove this project?'). If confirmed, check if removing active project. If so, switch to first remaining project or clear active project if no others exist. Call removeProject(path) from useConfig hook. Update sidebar to remove project from list. Use Tauri's dialog.ask() for native confirmation dialog or custom React modal.
