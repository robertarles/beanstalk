---
# beanstalk-lmx4
title: Implement search_beans command with case-insensitive matching
status: todo
type: task
tags:
    - master
    - tm_id:6
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-v5m3
---

Implement search functionality that matches query against bean titles and bodies

## Details

Implement search_beans(project_path: String, query: String) -> Result<Vec<Bean>, String>. Load all beans using get_beans logic. Filter beans where query matches title or body content (case-insensitive). Use .to_lowercase() for both query and search fields. Return Vec<Bean> of matching results. Handle empty query by returning all beans. Optimize for performance with lazy evaluation if possible.
