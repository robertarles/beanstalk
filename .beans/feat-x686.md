---
# feat
title: 'FEAT: add a “touch” button'
status: completed
type: task
priority: normal
created_at: 2026-04-21T13:52:00Z
updated_at: 2026-04-21T14:11:34Z
---

After making an edit to the issue body, the updated status does not change.
Add small “touch” button in the edit area of each task that will update the “updated_at" field to the current date+time in the correct format that is already used by beans

## Implementation

- [x] Add `touchBean` to tauri.ts (calls update_bean with only projectPath + beanId → keeps all fields, updates updated_at)
- [x] Add `onTouch` prop and `isTouching` state to BeanDetail
- [x] Add `handleTouch` callback in BeanDetail
- [x] Add Touch button in edit area body note section
- [x] Add `handleTouch` in App.tsx and wire to BeanDetail

## Summary of Changes

Added a "Touch" button to the edit area body note section in BeanDetail. When clicked, it calls `touchBean` (a new tauri.ts helper that invokes `update_bean` with only the required projectPath + beanId — leaving all optional fields as None/undefined so the Rust backend keeps existing values and writes a fresh `updated_at: now`).
