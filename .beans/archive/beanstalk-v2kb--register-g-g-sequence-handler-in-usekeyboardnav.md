---
# beanstalk-v2kb
title: Register 'g g' sequence handler in useKeyboardNav
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-vola
---

Add tinykeys binding for the 'g g' key sequence that jumps to the first bean in the list

## Details

In the useKeyboardNav hook, register a tinykeys binding using the sequence syntax: tinykeys(window, {'g g': handleJumpToTop}). The handler should set selectedBeanIndex to 0. Use tinykeys' built-in sequence support which expects two 'g' presses within 500ms by default. This binding should work across all focus states.
