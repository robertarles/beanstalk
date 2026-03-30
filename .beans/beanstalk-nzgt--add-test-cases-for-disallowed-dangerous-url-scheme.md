---
# beanstalk-nzgt
title: Add test cases for disallowed dangerous URL schemes
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T14:13:04Z
parent: beanstalk-js7j
---

Create test cases verifying isAllowedUrl returns false for javascript:, file:, and data: schemes

## Details

Add three security-focused test cases: (1) Returns false for javascript:alert(1), (2) Returns false for file:///etc/passwd, (3) Returns false for data:text/html,<script>alert(1)</script>. These test the critical security boundary preventing XSS and local file access attacks.

## Summary of Changes\n\nAdded test cases for disallowed dangerous URL schemes (javascript, file, data, ftp).
