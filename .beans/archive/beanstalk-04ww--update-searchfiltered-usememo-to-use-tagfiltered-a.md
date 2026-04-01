---
# beanstalk-04ww
title: Update searchFiltered useMemo to use tagFiltered as input
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-04-01T16:06:07Z
updated_at: 2026-04-01T16:21:44Z
parent: beanstalk-yvsg
---

Modify the searchFiltered useMemo to consume tagFiltered instead of statusFiltered, and update all internal references and the dependency array accordingly.

## Details

In src/components/BeanList.tsx around line 230, update the searchFiltered useMemo to: (1) change the initial return from statusFiltered to tagFiltered when no search query exists, (2) change tagFiltered.reduce() call instead of statusFiltered.reduce() in the search logic, (3) update the dependency array from [statusFiltered, debouncedSearch] to [tagFiltered, debouncedSearch]. This ensures search filtering operates on tag-filtered results.
