---
# beanstalk-7i6q
title: Implement Tauri event emission with beans-changed event and payload
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:32:23Z
parent: beanstalk-mwxa
---

Emit Tauri events to frontend with change type (created/modified/deleted) and affected file information

## Details

1. Import tauri::Manager and tauri::AppHandle
2. Store AppHandle reference in FileWatcher struct or pass it to event handler
3. Define event payload struct:
   ```rust
   #[derive(Clone, serde::Serialize)]
   struct BeanChangeEvent {
     change_type: String, // "created", "modified", "deleted"
     file_path: String,
     bean_id: Option<String>, // extracted from filename
     timestamp: i64, // Unix timestamp
   }
   ```
4. Map notify EventKind to change_type:
   - EventKind::Create -> "created"
   - EventKind::Modify -> "modified"
   - EventKind::Remove -> "deleted"
5. Extract bean ID from file path (filename without extension)
6. Use app_handle.emit_all("beans-changed", payload) to send event
7. Add error logging if emit fails
8. Add timestamp using std::time::SystemTime
