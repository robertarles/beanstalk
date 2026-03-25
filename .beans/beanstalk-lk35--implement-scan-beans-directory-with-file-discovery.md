---
# beanstalk-lk35
title: Implement scan_beans_directory() with file discovery
status: todo
type: task
tags:
    - master
    - tm_id:5
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-bhh6
---

Create function to recursively scan .beans/ directory and parse all markdown files into Bean collection

## Details

Implement scan_beans_directory(project_path: PathBuf) -> Result<Vec<Bean>> in scanner.rs. Use walkdir crate to recursively traverse .beans/ directory. Filter for .md files only. For each file, call parse_bean_file(). Collect all successfully parsed beans into a vector. Log warnings for files that fail to parse but continue processing. Initially return flat list (parent-child relationships built in next subtask). Sort by created date descending.
