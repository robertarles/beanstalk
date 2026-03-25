---
# beanstalk-9xx8
title: Integrate file watcher with frontend real-time updates
status: todo
type: epic
priority: normal
tags:
    - master
    - tm_id:11
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T18:05:43Z
parent: beanstalk-ut4w
blocked_by:
    - beanstalk-jwvb
    - beanstalk-lpiz
---

Connect backend file watcher events to frontend state to automatically refresh bean list on external changes

## Details

1. Set up Tauri event listener in useBeans hook:
```typescript
useEffect(() => {
  const unlisten = await listen('beans-changed', (event) => {
    console.log('Beans changed:', event.payload);
    loadBeans(); // Refresh bean list
    // Optionally: show visual indicator for 2 seconds
  });
  return () => unlisten();
}, [projectPath]);
```
2. Start file watcher when project is loaded:
   - Call start_watching command in useEffect when projectPath changes
   - Stop watcher when component unmounts or project changes
3. Implement visual change indicator:
   - Show brief highlight on affected bean row (if visible)
   - Or show toast/badge notification: "Beans updated"
   - Fade out after 2 seconds
4. Optimize refresh strategy:
   - Option A: Full list refresh (simpler, adequate for v1)
   - Option B: Partial update based on event payload (affected bean ID)
5. Handle edge cases:
   - If user is editing a bean that gets externally modified, warn them
   - If selected bean is deleted externally, clear selection
   - If user has unsaved changes, don't overwrite their form state
6. Debounce multiple rapid events (may happen during git operations)
7. Add visual indicator in UI (e.g., subtle pulse or timestamp in footer)
8. Ensure watcher restarts correctly when switching projects
