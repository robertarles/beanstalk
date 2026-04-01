---
# beanstalk-5gfk
title: Implement Escape handler for selection clearing and search input clearing
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-wpj0
---

Add final level of Escape handling to clear bean selection, and update BeanList search input to clear query on Escape

## Details

In the Escape handler cascade, if no modal is open, no input is focused, and BeanDetail is not editing, clear the current bean selection (set selectedBeanIndex to null or -1). Additionally, update the BeanList search input component to handle Escape keydown: when Escape is pressed in the search input, clear the search query value and optionally refocus the bean list. This provides a consistent 'cancel/clear' behavior for Escape across the application.
