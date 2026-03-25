---
# beanstalk-dfsb
title: Implement form submission with create_bean command integration
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T19:48:11Z
parent: beanstalk-rc33
---

Wire up the Save button to call the create_bean Tauri command, handle success (close form, select new bean, refresh list) and error cases

## Details

1. Import and call create_bean Tauri command with form data on Save click
2. Show loading state on Save button during API call
3. On success: close the form, refresh bean list from backend, auto-select newly created bean, navigate to show it in detail pane
4. On error: display error message inline in form, keep form open with data intact
5. Ensure file watcher picks up new bean (or trigger manual refresh)
6. Handle edge cases: network errors, file system errors, duplicate IDs
7. Add optimistic UI updates if appropriate
8. Clear form state after successful submission if form is reused
