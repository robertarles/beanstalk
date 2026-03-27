---
# beanstalk-au65
title: Validate JSON syntax of modified capabilities file
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:58:08Z
parent: beanstalk-ytny
---

Ensure the modified default.json has valid JSON syntax and correct structure

## Details

Parse the modified JSON file to verify it's syntactically valid. Check that the permissions array structure is correct with both 'core:default' string and the new opener permission object. Ensure all brackets, braces, and commas are properly formatted.
