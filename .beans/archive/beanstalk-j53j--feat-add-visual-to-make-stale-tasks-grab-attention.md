---
# beanstalk-j53j
title: 'FEAT: add visual to make stale tasks grab attention'
status: completed
type: task
priority: normal
created_at: 2026-04-15T11:20:29Z
updated_at: 2026-04-15T11:38:32Z
---

Make the priority flash for critical tasks if they are stale. Stale is defined as critical priority, not updated within 12 hours, or high priority, not updated within 48 hours.

## Summary of Changes

Added stale-task visual indicator:
- Added  helper that returns true for critical-priority beans not updated within 12 hours, or high-priority beans not updated within 48 hours.
- Added  CSS animation in  (1.2s ease-in-out infinite fade between full and 25% opacity).
- Priority badge on stale beans gets the  class applied, causing it to pulse and grab attention.
