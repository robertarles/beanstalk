---
# beanstalk-c36m
title: Create TypeScript type definitions for beans and app config
status: todo
type: task
tags:
    - master
    - tm_id:2
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-zcyx
---

Define TypeScript interfaces in types/beans.ts for Bean, AppConfig, Project, and API response types to ensure type safety across the frontend

## Details

Create types/beans.ts with interfaces: Bean (id, title, status, tags, assignee, created_date, modified_date, body, parent_id, children), AppConfig (projects, last_active_project, editor, window_size), ProjectConfig (path, name), and API response types for Tauri command results. Include Status enum (Open, InProgress, Blocked, Done, Cancelled, Deferred). Export all types for use across components and hooks.
