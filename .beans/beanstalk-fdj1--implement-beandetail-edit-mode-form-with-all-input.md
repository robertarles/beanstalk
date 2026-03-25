---
# beanstalk-fdj1
title: Implement BeanDetail edit mode form with all input fields
status: todo
type: task
tags:
    - master
    - tm_id:2
created_at: 2026-03-25T18:05:42Z
updated_at: 2026-03-25T18:05:42Z
parent: beanstalk-64k3
---

Create the edit mode UI with form inputs for title, status, tags, assignee, and body

## Details

Build edit mode layout with: title input field (text), status dropdown populated from project config + defaults, tags input supporting comma-separated or tag chips with add/remove, assignee input (text), body textarea for plain markdown editing. Implement form state management to track changes. Style inputs to match macOS native look with proper focus states.
