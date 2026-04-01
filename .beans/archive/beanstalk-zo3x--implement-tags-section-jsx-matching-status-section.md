---
# beanstalk-zo3x
title: Implement Tags section JSX matching Status section styling
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:43Z
parent: beanstalk-3nce
---

Add complete Tags filter section JSX after the Status section, including divider, header with conditional 'All' button, and tag list with checkboxes

## Details

In src/components/Sidebar.tsx, after the Status section (around line 180), add:

1. Divider matching line 125 style: border-t border-gray-200 dark:border-gray-800
2. Section container with px-3 pb-4 classes
3. Header row with 'TAGS' label (text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400)
4. Conditional 'All' button when tagFilter.length > 0 (text-xs text-blue-500 dark:text-blue-400 hover:underline)
5. Tag list (ul with space-y-0.5) mapping over tags array
6. Each tag as button with checkbox indicator and same styling as Status section buttons
7. Wrap entire section in conditional: {tags.length > 0 && (...)}

Use exact className patterns from Status section (lines 128-180) for visual parity.
