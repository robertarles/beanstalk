---
# beanstalk-js7j
title: Replace parseBodyWithLinks tests with isAllowedUrl tests
status: completed
type: epic
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T14:13:12Z
parent: beanstalk-64n0
---

Update markdown.test.ts to test only the isAllowedUrl function instead of parseBodyWithLinks

## Details

In src/test/lib/markdown.test.ts:
1. Remove all parseBodyWithLinks test cases
2. Add comprehensive isAllowedUrl test cases:
   - Returns true for https://example.com
   - Returns true for http://example.com
   - Returns false for javascript:alert(1)
   - Returns false for file:///etc/passwd
   - Returns false for data:text/html,<script>alert(1)</script>
   - Returns false for invalid URLs (malformed strings)
   - Returns false for empty string

These tests validate the security boundary that prevents non-HTTP schemes from being clickable.

## Summary of Changes\n\nReplaced parseBodyWithLinks tests with isAllowedUrl tests in markdown.test.ts and updated BeanDetail link test.
