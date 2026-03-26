---
# beanstalk-m9qt
title: 'Edit bean: parent selection not saved'
status: completed
type: bug
priority: high
created_at: 2026-03-26T14:13:53Z
updated_at: 2026-03-26T14:16:47Z
---

When editing a bean via the Edit button (inline editor, not 'Open in editor') and setting a parent bean, the parent field is not persisted after saving. The update_bean command or the frontend may not be passing the parent field through the edit flow.

## Summary of Changes\n\n- **commands.rs**: Added `parent: Option<Option<String>>` to `update_bean` — `Some(Some(id))` sets parent, `Some(None)` clears it, `None` preserves existing. Updated `parent_line` to use the new value instead of always reading `existing.parent`. Updated all internal call sites.\n- **tauri.ts**: Added `parent?: string | null` to `updateBean` params.\n- **App.tsx**: Pass `fields.parent` through to `updateBean`.\n- **BeanDetail.tsx**: Added `editParentId` to `handleSave` dependency array (stale closure bug).
