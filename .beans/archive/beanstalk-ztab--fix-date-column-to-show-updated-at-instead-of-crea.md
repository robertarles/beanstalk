---
# beanstalk-ztab
title: fix date column to show updated_at instead of created_at
status: completed
type: bug
priority: normal
created_at: 2026-04-15T12:25:43Z
updated_at: 2026-04-15T12:26:06Z
---

The Date column in BeanList shows created_at, so it never appears to change after edits. Should show updated_at (falling back to created_at) and be labelled Updated.

## Summary of Changes

Changed BeanList.tsx in three places:
- Sort key for 'date' column now uses updated_at ?? created_at ?? id
- Column header changed from 'Date' to 'Updated'
- Row date cell now shows formatDate(bean.updated_at ?? bean.created_at)
