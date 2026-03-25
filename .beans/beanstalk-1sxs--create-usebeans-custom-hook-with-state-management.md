---
# beanstalk-1sxs
title: Create useBeans custom hook with state management
status: todo
type: task
tags:
    - master
    - tm_id:1
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-ibdp
---

Implement the useBeans hook to manage beans state, selected bean, filters (status and search), and sort options with memoized filtering logic

## Details

Create a custom React hook that: 1) Manages state for beans array, selectedBean, filter object (status, search), and sortBy field. 2) Implements loadBeans async function that calls invoke('get_beans') with projectPath. 3) Creates filteredBeans memoized value that chains status filter, search filter, and sorting logic. 4) Returns object with beans (filtered), selectedBean, setSelectedBean, loadBeans, setFilter, and setSortBy. 5) Uses useMemo for performance optimization to only recalculate when beans, filter, or sortBy changes. 6) Handles null projectPath gracefully by returning early from loadBeans.
