---
# beanstalk-kezi
title: 'FEAT: add beans issue fields “blocking” and “blocked_by"'
status: completed
type: task
priority: normal
created_at: 2026-04-17T19:25:04Z
updated_at: 2026-04-17T21:44:22Z
---

Be sure to research the field names and get the markdown correct. The goal is to add blocking and blocked_by to the “New Bean”,  “view bean” and “edit bean” forms.

## Summary of Changes

- Added `blocking` and `blocked_by` fields to the `Bean` struct (Rust) and `Bean` interface (TypeScript)
- Backend (`beans/mod.rs`): parses `blocking`/`blocked_by` YAML sequences from frontmatter
- Backend (`commands.rs`): `create_bean` and `update_bean` commands accept and write these fields; added `yaml_id_list_block` helper for YAML sequence generation
- Frontend (`lib/tauri.ts`): `createBean`/`updateBean` API wrappers include the new fields
- New component `RelatedBeansSelect.tsx`: multi-select dropdown for picking related beans
- `CreateBeanForm`: added Blocking and Blocked By fields
- `BeanDetail`: edit mode adds Blocking/Blocked By selects; view mode shows them as colored badges
- `App.tsx`: `handleSave` passes `blocking`/`blocked_by` through to `updateBean`
- All test fixtures updated with the new required fields
