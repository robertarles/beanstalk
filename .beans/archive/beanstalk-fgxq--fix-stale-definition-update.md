---
# beanstalk-fgxq
title: 'FIX: Stale definition update'
status: completed
type: task
priority: normal
created_at: 2026-04-15T15:03:55Z
updated_at: 2026-04-15T15:36:47Z
---

stale should include only issues not of status complete or scrapped.

## Summary of Changes
Added status check to isStale() in BeanList.tsx and countStaleBeans() in App.tsx: beans with status 'completed' or 'scrapped' are never considered stale.
