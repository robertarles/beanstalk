---
# beanstalk-h1qe
title: Add tags prop to Sidebar invocation
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:43Z
parent: beanstalk-soyx
---

Add tags={availableTags} prop to provide the list of available tags to Sidebar

## Details

In the Sidebar component invocation (around line 296), add the prop `tags={availableTags}` as the final new prop. This passes the derived list of all available tags from the beans to the Sidebar component, enabling it to render the Tags section with all available tag options.
