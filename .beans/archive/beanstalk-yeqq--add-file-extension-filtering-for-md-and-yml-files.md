---
# beanstalk-yeqq
title: Add file extension filtering for .md and .yml files only
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:32:23Z
parent: beanstalk-mwxa
---

Filter file system events to only process changes to .md and .yml bean files, ignoring other file types

## Details

1. Import std::path::Path for path manipulation
2. In event handler, extract file path from Event
3. Check file extension using path.extension()
4. Create whitelist: ["md", "yml", "yaml"]
5. Skip events if extension not in whitelist
6. Handle events for files without extensions (ignore them)
7. Handle directory events vs file events (only process file events)
8. Log filtered events at debug level for troubleshooting
9. Ensure filtering happens after debouncing to reduce processing overhead
