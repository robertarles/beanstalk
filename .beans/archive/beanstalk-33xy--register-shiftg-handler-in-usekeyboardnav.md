---
# beanstalk-33xy
title: Register 'Shift+G' handler in useKeyboardNav
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-vola
---

Add tinykeys binding for Shift+G that jumps to the last bean in the list

## Details

In the useKeyboardNav hook, register a tinykeys binding: tinykeys(window, {'Shift+g': handleJumpToBottom}). The handler should set selectedBeanIndex to flatBeans.length - 1. This provides the vim-style 'G' command to jump to the end of the list. This binding should work across all focus states.
