---
# beanstalk-zsth
title: Implement BeanList component with search, sortable table, and expandable rows
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:35:53Z
parent: beanstalk-zcyx
---

Create BeanList.tsx component with search bar, sortable table displaying beans (title, status, ID, date columns), expandable child beans, and New Bean button

## Details

Create components/BeanList.tsx with: 1) Search bar at top with text input for filtering beans by title/body. 2) Sortable table with columns: title, status, ID, created_date/modified_date. Implement column header click handlers for sorting (ascending/descending). 3) Table rows with click handlers to select bean (highlight selected row). 4) Support for expandable children - render nested beans with indentation and expand/collapse icons. 5) New Bean button at bottom. 6) Use useBeans hook to fetch and filter bean data. Style table with macOS native appearance (alternating row colors, subtle borders).
