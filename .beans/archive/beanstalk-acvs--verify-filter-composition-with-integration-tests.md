---
# beanstalk-acvs
title: Verify filter composition with integration tests
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-04-01T16:06:07Z
updated_at: 2026-04-01T16:21:44Z
parent: beanstalk-yvsg
---

Write integration tests confirming that status, tag, and search filters compose correctly in sequence with accurate totalCount/filteredCount calculations.

## Details

Create integration tests in src/test/components/BeanList.test.tsx that: (1) apply status filter alone and verify count, (2) apply tag filter alone and verify beans are filtered with AND logic, (3) apply both status and tag filters and verify they compose correctly, (4) apply search on top of both filters and verify all three work together, (5) verify totalCount reflects only status filtering (for display) while filteredCount reflects all three filters, (6) verify filter order (status → tags → search) produces correct results.
