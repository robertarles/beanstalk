---
# beanstalk-6b3f
title: Write component tests for Sidebar Tags section rendering and interaction
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-04-01T16:06:08Z
updated_at: 2026-04-01T16:21:44Z
parent: beanstalk-6emn
blocked_by:
    - beanstalk-bt2x
---

Implement component tests verifying Tags section appears when tags exist, is hidden when none, clicking tags updates filter state, and 'All' button clears tag filter.

## Details

Use React Testing Library to render Sidebar component with mock props. Test: Tags section renders when tags array is non-empty, Tags section hidden when tags array empty, clicking a tag adds it to tagFilter state and shows active styling, clicking an active tag removes it from tagFilter, clicking 'All' button clears all active tags, verify onTagFilter callback is called with correct arguments. Mirror test patterns from existing Sidebar tests if available.
