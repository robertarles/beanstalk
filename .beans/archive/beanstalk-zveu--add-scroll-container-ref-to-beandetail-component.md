---
# beanstalk-zveu
title: Add scroll container ref to BeanDetail component
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:42Z
parent: beanstalk-b7q3
---

Modify BeanDetail.tsx to expose a ref to the scrollable container element so parent components can programmatically control scrolling

## Details

In src/components/BeanDetail.tsx (around line 333 where the scrollable div with overflow-y-auto is), add a ref using useRef hook and attach it to the scrollable container div. Use forwardRef to expose this ref to parent components, or alternatively pass a callback prop that receives the scroll element ref. The scrollable container is the div containing the bean content that has overflow-y-auto class.
