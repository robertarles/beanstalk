---
# beanstalk-51sf
title: Remove hardcoded 'done' status references
status: completed
type: bug
priority: normal
created_at: 2026-03-26T14:44:34Z
updated_at: 2026-03-26T14:46:30Z
---

The app hardcodes 'done' as a status option in several places, but the correct status used by this project is 'completed'. Hardcoded status lists should be removed in favour of deriving statuses dynamically from the loaded beans, which already happens for the filter. The CreateBeanForm and BeanDetail still use hardcoded lists that include 'done' but not 'completed'.

## Summary of Changes\n\n- **BeanDetail.tsx**: Added `'completed'` and `'scrapped'` to `statusBadgeClass` (kept `'done'` as fallback for backward compat).\n- **BeanList.tsx**: Added `'completed'` and `'scrapped'` to `statusDotClass`.\n- **Tests**: Updated all hardcoded `'done'` status values to `'completed'` and `'archived'` to `'scrapped'` across BeanDetail, BeanList, Sidebar, and CreateBeanForm tests.
