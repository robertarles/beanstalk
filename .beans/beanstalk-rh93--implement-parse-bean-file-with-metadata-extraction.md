---
# beanstalk-rh93
title: Implement parse_bean_file() with metadata extraction
status: todo
type: task
tags:
    - master
    - tm_id:3
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-bhh6
---

Create function to parse individual bean markdown files into Bean structs with robust handling of all metadata fields

## Details

Implement parse_bean_file(path: PathBuf) -> Result<Bean> in parser.rs. Read file contents, extract frontmatter using the extraction function. Parse metadata fields: title (required), status (default to 'open'), created date with chrono supporting multiple formats (ISO 8601, RFC 3339, custom formats), tags as Vec<String>, optional assignee. Extract or generate ID from filename or metadata. Store file_path. Initialize parent_id as None and children as empty vector. Return detailed errors for missing required fields.
