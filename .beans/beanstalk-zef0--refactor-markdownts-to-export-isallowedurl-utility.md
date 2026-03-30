---
# beanstalk-zef0
title: Refactor markdown.ts to export isAllowedUrl utility
status: completed
type: epic
priority: high
tags:
    - master
    - tm_id:2
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T14:11:00Z
parent: beanstalk-64n0
---

Simplify markdown.ts by removing parseBodyWithLinks and BodySegment type, keeping only isAllowedUrl function

## Details

In src/lib/markdown.ts:
1. Keep the isAllowedUrl function as-is (validates http: and https: schemes)
2. Export isAllowedUrl for use in BeanDetail component
3. Remove the parseBodyWithLinks function (no longer needed with react-markdown)
4. Remove the BodySegment type export

Final file should contain:
- ALLOWED_SCHEMES constant
- isAllowedUrl function (exported)

This simplification is possible because react-markdown handles all parsing internally.

## Summary of Changes\n\nRefactored markdown.ts to remove BodySegment type and parseBodyWithLinks function, and export isAllowedUrl function.
