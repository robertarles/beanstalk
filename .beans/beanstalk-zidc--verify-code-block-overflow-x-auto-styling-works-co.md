---
# beanstalk-zidc
title: Verify code block overflow-x-auto styling works correctly
status: todo
type: task
tags:
    - master
    - tm_id:1
created_at: 2026-03-30T13:57:15Z
updated_at: 2026-03-30T13:57:15Z
parent: beanstalk-tx5n
---

Test that the existing overflow-x-auto class on pre elements allows horizontal scrolling for wide code blocks

## Details

The pre renderer in ReactMarkdown already has overflow-x-auto applied. Verify this works by: (1) Examining the current BeanDetail.tsx component to locate the pre renderer in the ReactMarkdown components prop, (2) Creating a test bean with a code block containing a line with 200+ characters, (3) Rendering the bean in the UI and verifying horizontal scroll appears within the code block without affecting parent layout. Document findings to confirm no additional changes are needed for code blocks.
