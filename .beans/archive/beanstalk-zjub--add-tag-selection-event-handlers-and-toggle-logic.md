---
# beanstalk-zjub
title: Add tag selection event handlers and toggle logic
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-3nce
---

Implement onClick handlers for tag buttons to toggle selection and for 'All' button to clear all selections

## Details

In the Tags section JSX:

1. For each tag button onClick:
   - Check if tag is in tagFilter (const isActive = tagFilter.includes(tag))
   - If active: remove from filter using onTagFilter(tagFilter.filter((t) => t !== tag))
   - If inactive: add to filter using onTagFilter([...tagFilter, tag])

2. For 'All' button onClick:
   - Call onTagFilter([]) to clear all selected tags

3. Apply active styling:
   - Use isActive to conditionally apply active button classes
   - Show checkmark in checkbox span when isActive is true
   - Mirror the exact pattern from Status section toggle logic

This implements multi-select behavior where multiple tags can be active simultaneously.
