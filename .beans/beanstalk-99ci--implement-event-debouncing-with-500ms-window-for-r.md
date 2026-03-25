---
# beanstalk-99ci
title: Implement event debouncing with 500ms window for rapid changes
status: todo
type: task
tags:
    - master
    - tm_id:3
created_at: 2026-03-25T18:05:41Z
updated_at: 2026-03-25T18:05:41Z
parent: beanstalk-mwxa
---

Add debouncing logic to coalesce rapid file system events (common during git operations or batch saves)

## Details

1. Add tokio or async-std dependency for async timing utilities
2. Create debounce map: HashMap<PathBuf, Instant> to track last event time per file
3. When receiving file system event:
   - Check if file path exists in debounce map
   - If exists and less than 500ms since last event, skip processing
   - If not exists or >500ms elapsed, process event and update timestamp
4. Use tokio::time::sleep or std::time::Duration for timing
5. Add cleanup logic to remove old entries from debounce map (prevent memory leak)
6. Consider using debounce crate or implement simple time-based debouncing
7. Handle edge case: ensure final event in a burst is eventually processed
