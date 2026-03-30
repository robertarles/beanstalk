---
# beanstalk-rvqb
title: Export isAllowedUrl function
status: todo
type: task
tags:
    - master
    - tm_id:2
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T13:57:14Z
parent: beanstalk-zef0
---

Add export keyword to the isAllowedUrl function declaration to make it available for import in other modules

## Details

Modify line 7 in src/lib/markdown.ts from 'function isAllowedUrl(url: string): boolean {' to 'export function isAllowedUrl(url: string): boolean {'. This makes the function available for import in BeanDetail.tsx while keeping its implementation unchanged.
