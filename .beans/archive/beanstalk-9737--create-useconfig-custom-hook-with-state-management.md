---
# beanstalk-9737
title: Create useConfig custom hook with state management
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:39:31Z
parent: beanstalk-fnbr
---

Implement a React custom hook that manages application configuration state, including loading config, adding/removing projects, and setting active project

## Details

Create src/hooks/useConfig.ts with useState for AppConfig. Implement loadConfig() using invoke('get_config'), addProject(path) using invoke('add_project', { path }), removeProject(path) using invoke('remove_project', { path }), and setActiveProject(path) using invoke('set_active_project', { path }). Each mutation should call loadConfig() to refresh state. Return { config, loadConfig, addProject, removeProject, setActiveProject } from the hook. Handle loading states and errors appropriately.
