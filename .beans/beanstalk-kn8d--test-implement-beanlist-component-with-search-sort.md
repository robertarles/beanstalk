---
# beanstalk-kn8d
title: 'Test: Implement BeanList component with search, sortable table, and expandable rows'
status: todo
type: task
tags:
    - tm_id:5.testStrategy
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-zcyx
blocked_by:
    - beanstalk-zsth
---

Unit tests: verify search filters beans correctly, sorting by each column works (both directions), row selection updates state, expand/collapse toggles children visibility, New Bean button triggers handler. Visual testing with mock data: test with 0 beans, 1 bean, 50 beans, nested beans (parent with 3 children). Verify table scrolls correctly when content exceeds viewport height.
