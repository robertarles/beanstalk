---
# beanstalk-9bgl
title: Verify parent container allows horizontal scrolling
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-30T13:57:15Z
updated_at: 2026-03-30T14:08:14Z
parent: beanstalk-tx5n
---

Ensure the .flex-1 div wrapping the body section doesn't prevent horizontal scroll for overflow content

## Details

Inspect the BeanDetail component's layout structure, specifically the container with .flex-1 class that wraps the body/markdown content. Verify this container doesn't have overflow-hidden or any other style that would prevent child elements from scrolling horizontally. The container should allow overflow-x-auto on child elements (tables, code blocks) to function properly. Check the parent flex layout to ensure it doesn't impose constraints. If issues are found, adjust the container's className to explicitly allow horizontal overflow (e.g., ensure no 'overflow-hidden' is applied).
