---
# beanstalk-53v6
title: Implement project switching with active highlighting and bean refresh
status: todo
type: task
tags:
    - master
    - tm_id:4
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-fnbr
---

Enable clicking project names in sidebar to switch active project, with visual feedback and bean list/file watcher updates

## Details

Make project names in sidebar clickable. On click, call setActiveProject(path) from useConfig. Add CSS class to highlight currently active project in sidebar (bold text or background color). After switching, trigger loadBeans() for new project path. Stop existing file watcher for old project and start watcher for new project using Tauri backend command. Update BeanList component to show beans from new active project. Save last_active_project in backend config for persistence across restarts.
