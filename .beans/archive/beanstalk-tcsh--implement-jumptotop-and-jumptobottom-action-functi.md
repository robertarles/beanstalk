---
# beanstalk-tcsh
title: Implement jumpToTop and jumpToBottom action functions
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-vola
---

Create action functions that handle the jump operations and return them from the hook

## Details

Create two functions in useKeyboardNav: jumpToTop() that sets selectedBeanIndex to 0, and jumpToBottom() that sets selectedBeanIndex to flatBeans.length - 1. These functions should be returned from the hook along with other navigation actions. They encapsulate the jump logic and can be called by the tinykeys handlers or other components.
