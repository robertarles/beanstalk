---
# beanstalk-l0bf
title: Tests for tag filter feature
status: completed
type: task
priority: normal
created_at: 2026-04-01T17:00:10Z
updated_at: 2026-04-01T17:05:41Z
parent: beanstalk-ghh8
---

Update makeBean() helpers with tags field if needed. Add tests for: filterByTags AND logic (single tag, multiple tags, no match), filterByTags tree recursion (child match keeps parent), collectTags deduplication and sort, Sidebar renders Tags section with correct active states, tagFilter prop on BeanList filters visible rows. Files: src/test/components/BeanList.test.tsx, src/test/components/Sidebar.test.tsx (create if needed)
