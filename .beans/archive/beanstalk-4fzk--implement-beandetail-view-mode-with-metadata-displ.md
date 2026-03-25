---
# beanstalk-4fzk
title: Implement BeanDetail view mode with metadata display and markdown rendering
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:39:07Z
parent: beanstalk-64k3
---

Create the read-only view mode of the BeanDetail component that displays bean metadata and rendered markdown content

## Details

Build BeanDetail component view mode with: title as h1, status badge styled by status color, metadata grid showing ID/created date/tags as pills/assignee, markdown body rendered using react-markdown with safe sanitization supporting code blocks/lists/headers/links, action buttons for Edit and Open in Editor. Style to match macOS native look using TailwindCSS or plain CSS.
