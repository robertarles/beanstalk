---
# beanstalk-zye6
title: Implement BeanList table component with row selection
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:38:11Z
parent: beanstalk-ibdp
---

Create the BeanList table component that renders beans in a table with columns for status icon, title, ID, and created date, with clickable rows for selection

## Details

Build a table component that: 1) Renders four columns: status icon (visual indicator), title (text), ID (shortened hash), and created date (formatted). 2) Maps over beans array from useBeans hook to create table rows. 3) Implements onClick handler for rows that calls setSelectedBean. 4) Applies highlight/active styling to row when bean.id matches selectedBean.id. 5) Formats created date using a date library or Intl.DateTimeFormat. 6) Uses appropriate semantic HTML (table, thead, tbody, tr, th, td) for accessibility. 7) Handles empty beans array with appropriate message.
