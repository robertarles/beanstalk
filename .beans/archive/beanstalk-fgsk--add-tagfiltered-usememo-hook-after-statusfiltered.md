---
# beanstalk-fgsk
title: Add tagFiltered useMemo hook after statusFiltered
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-04-01T16:06:07Z
updated_at: 2026-04-01T16:21:43Z
parent: beanstalk-yvsg
---

Create a new useMemo that applies filterByTags to the statusFiltered beans, maintaining proper dependency array with statusFiltered and tagFilter.

## Details

In src/components/BeanList.tsx around line 220, add the tagFiltered useMemo hook after the statusFiltered hook. The hook should call filterByTags(statusFiltered, tagFilter) and include both statusFiltered and tagFilter in the dependency array. This establishes the tag filtering stage in the pipeline after status filtering.
