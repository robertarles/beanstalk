---
# beanstalk-9sm4
title: Add collectTags call in App component
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-04-01T16:06:06Z
updated_at: 2026-04-01T16:21:42Z
parent: beanstalk-gt0o
---

Invoke collectTags alongside collectStatuses to make available tags accessible in the component

## Details

In the App component body, locate where availableStatuses is defined (should be near where collectStatuses is called). Add: const availableTags = collectTags(beans); This makes the collected tags available for use in the component, mirroring how statuses are made available.
