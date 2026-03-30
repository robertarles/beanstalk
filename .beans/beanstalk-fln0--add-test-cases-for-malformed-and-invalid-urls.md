---
# beanstalk-fln0
title: Add test cases for malformed and invalid URLs
status: todo
type: task
tags:
    - master
    - tm_id:4
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T13:57:14Z
parent: beanstalk-js7j
---

Create test cases verifying isAllowedUrl handles edge cases like malformed strings and empty input

## Details

Add two edge case test scenarios: (1) Returns false for invalid URLs (malformed strings like 'not a url' or 'ht!tp://bad'), (2) Returns false for empty string. These ensure the function gracefully handles invalid input without throwing exceptions.
