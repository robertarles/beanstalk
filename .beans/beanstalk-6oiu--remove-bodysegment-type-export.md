---
# beanstalk-6oiu
title: Remove BodySegment type export
status: todo
type: task
tags:
    - master
    - tm_id:3
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T13:57:14Z
parent: beanstalk-zef0
---

Delete the BodySegment type definition since it's only used by parseBodyWithLinks which will be removed

## Details

Remove lines 1-3 from src/lib/markdown.ts: 'export type BodySegment = | { type: 'text'; text: string } | { type: 'link'; text: string; url: string };'. This type is no longer needed after react-markdown integration.
