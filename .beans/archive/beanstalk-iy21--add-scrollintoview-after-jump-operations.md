---
# beanstalk-iy21
title: Add scrollIntoView after jump operations
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:42Z
parent: beanstalk-vola
---

Ensure the selected bean scrolls into view after gg or G jump

## Details

After setting selectedBeanIndex in both jumpToTop and jumpToBottom, trigger scrollIntoView on the newly selected bean element. This may require either: (a) using a ref callback to get the selected bean's DOM element, or (b) using a useEffect that watches selectedBeanIndex and calls scrollIntoView on the corresponding element. Use {behavior: 'smooth', block: 'nearest'} for smooth scrolling.
