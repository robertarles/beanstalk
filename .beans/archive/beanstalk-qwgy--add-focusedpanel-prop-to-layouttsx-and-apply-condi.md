---
# beanstalk-qwgy
title: Add focusedPanel prop to Layout.tsx and apply conditional focus ring styles
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:09:01Z
parent: beanstalk-clwg
blocked_by:
    - beanstalk-gie7
---

Update Layout component to accept focusedPanel prop and apply ring-2 ring-blue-500 classes conditionally to sidebar, list, and detail panel containers based on which panel is focused

## Details

In Layout.tsx: Add focusedPanel: 'sidebar' | 'list' | 'detail' to component props interface. Update the three panel container divs (sidebar, list, detail) to conditionally apply 'ring-2 ring-blue-500' classes when focusedPanel matches that panel. Use className concatenation or clsx/cn utility. Ensure the focus ring is visible in both light and dark modes by testing the default Tailwind ring colors work with existing dark mode setup. Example: className={cn('...existing classes...', focusedPanel === 'sidebar' && 'ring-2 ring-blue-500')}
