---
# beanstalk-rgvc
title: Implement status filter sidebar with dynamic statuses and counts
status: todo
type: task
tags:
    - master
    - tm_id:5
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-ibdp
---

Create a sidebar status filter that extracts unique statuses from beans and .beans.yml config, displays them with count badges, and includes an 'All' option

## Details

Implement status filtering: 1) Create StatusFilter component in sidebar. 2) Extract unique statuses from beans array combined with statuses from .beans.yml config (load via invoke or pass as prop). 3) Display 'All' option first, then each status as clickable filter button/link. 4) Calculate and display count badge next to each status showing number of beans with that status. 5) Highlight active filter. 6) Call setFilter({ status: selectedStatus }) on click. 7) 'All' option sets status filter to 'all' to show everything. 8) Handle case where .beans.yml doesn't exist (use only beans data).
