---
# beanstalk-6p3a
title: CreateBeanForm fails with 'missing required key status'
status: completed
type: bug
priority: high
created_at: 2026-03-25T21:51:52Z
updated_at: 2026-03-25T21:53:55Z
---

When submitting the New Bean form, Tauri returns: 'invalid args `status` for command `create_bean`: command create_bean missing required key status'. The createBean() function in src/lib/tauri.ts does not include `status` in its params type, and CreateBeanForm.tsx does not pass `status` in the createBean() call, but the Rust create_bean command requires it as a non-optional String.

## Summary of Changes

- Added `status: string` to `createBean` params type in `src/lib/tauri.ts`
- Passed `status` state value in the `createBean` call in `src/components/CreateBeanForm.tsx`
- Updated existing test to assert `status` is always present in the `create_bean` invocation
- Added regression test verifying status is not omitted from the call
