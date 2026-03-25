---
# beanstalk-o4kj
title: Implement expandable children rows with chevron toggle
status: todo
type: task
tags:
    - master
    - tm_id:6
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-ibdp
---

Add expandable/collapsible rows for beans with children, including chevron icons, indent styling, and expand state management

## Details

Create hierarchical row display: 1) Add expandedBeans state (Set or array of IDs) to track which beans are expanded. 2) Render chevron icon (▶/▼) next to beans that have children (check bean.children array). 3) Toggle bean ID in expandedBeans set when chevron clicked. 4) Recursively render child beans as additional table rows when parent is expanded. 5) Apply indent styling (padding-left or nested structure) to visually show hierarchy depth. 6) Ensure child rows have same click behavior and selection as parent rows. 7) Handle multiple levels of nesting. 8) Optimize rendering for performance with many children.
