---
# beanstalk-915c
title: Register '/' key handler to focus search input
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-wpj0
---

Implement tinykeys binding for '/' key that finds and focuses the search input element in BeanList

## Details

In the useKeyboardNav hook (or App.tsx following the existing Cmd+F pattern at line 159-161), register a tinykeys handler for the '/' key. The handler should: 1) Query for the search input using `document.querySelector('[data-search-input]')` (attribute already exists at BeanList.tsx:266), 2) Call `.focus()` on the found element if it exists, 3) Optionally prevent default behavior to avoid typing '/' in the input. Follow the same guarding pattern as other key handlers to avoid triggering when already focused on an input.
