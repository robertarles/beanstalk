---
# beanstalk-z8ab
title: Implement search bar with debounced filtering
status: todo
type: task
tags:
    - master
    - tm_id:4
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-ibdp
---

Create a search input component with real-time filtering, 300ms debouncing, and a clear button

## Details

Build search functionality: 1) Create SearchBar component with controlled input tied to filter.search. 2) Implement debouncing using setTimeout or a library like lodash.debounce (300ms delay). 3) Call setFilter to update search term after debounce period. 4) Add clear button (X icon) that appears when search text is non-empty, clicking it clears the search. 5) Show search icon in input for visual clarity. 6) Use appropriate input type and placeholder text. 7) Ensure filtering in useBeans hook checks both title and body fields (case-insensitive).
