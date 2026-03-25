---
# beanstalk-stam
title: Implement sortable column headers with visual indicators
status: todo
type: task
tags:
    - master
    - tm_id:3
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-ibdp
---

Add clickable column headers that change sort order and display visual indicators for current sort column and direction

## Details

Enhance table headers to: 1) Make title, ID, and date column headers clickable. 2) Call setSortBy with appropriate field name on click. 3) Track sort direction (asc/desc) in component state, toggling on repeated clicks to same column. 4) Display arrow icon (↑/↓) or similar indicator next to active sort column. 5) Update useBeans hook sort logic to support direction (modify localeCompare and date comparison). 6) Apply visual styling to active sort header (bold, color change). 7) Handle three sort keys: 'date', 'status', 'title'.
