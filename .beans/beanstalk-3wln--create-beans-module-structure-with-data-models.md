---
# beanstalk-3wln
title: Create beans module structure with data models
status: todo
type: task
tags:
    - master
    - tm_id:1
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-bhh6
---

Set up the module hierarchy in src-tauri/src/beans/ with models.rs, parser.rs, and scanner.rs files, and define Bean and BeansConfig structs

## Details

Create src-tauri/src/beans/mod.rs and declare submodules. In models.rs, define the Bean struct with fields: id, title, status, created (DateTime<Utc>), tags, assignee, body, file_path, parent_id, and children vector. Define BeansConfig struct with name and optional statuses vector. Add necessary derives (Serialize, Deserialize, Clone, Debug) and imports for chrono and serde.
