---
# beanstalk-6msc
title: Write comprehensive unit tests for filterByTags function
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-04-01T16:06:07Z
updated_at: 2026-04-01T16:21:44Z
parent: beanstalk-vzg7
---

Create a complete test suite covering all scenarios for the filterByTags function including basic filtering, AND logic, tree structure preservation, and edge cases.

## Details

Create tests in src/test/components/BeanList.test.tsx (or add to existing file). Test cases: single tag filter matches correctly, multiple tags require ALL to match (AND logic), beans with partial tags are filtered out, recursive child filtering preserves tree structure, empty tags array returns all beans, beans with no tags are handled, deeply nested structures work correctly, and performance with large datasets. Use React Testing Library and jest for testing. Verify all tests pass with `npm test`.
