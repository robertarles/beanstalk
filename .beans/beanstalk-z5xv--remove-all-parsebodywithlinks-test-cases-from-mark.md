---
# beanstalk-z5xv
title: Remove all parseBodyWithLinks test cases from markdown.test.ts
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T14:12:57Z
parent: beanstalk-js7j
---

Delete existing parseBodyWithLinks test suite and related imports from the test file

## Details

In src/test/lib/markdown.test.ts, locate and remove all test cases for the parseBodyWithLinks function. This includes the entire describe block and any related setup code. Also remove the parseBodyWithLinks import if it's no longer needed. This prepares the file for the new isAllowedUrl tests.

## Summary of Changes\n\nRemoved all parseBodyWithLinks test cases from markdown.test.ts and replaced with isAllowedUrl tests.
