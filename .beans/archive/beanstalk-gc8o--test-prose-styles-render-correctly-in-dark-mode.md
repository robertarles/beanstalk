---
# beanstalk-gc8o
title: Test prose styles render correctly in dark mode
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T14:08:14Z
parent: beanstalk-8gcp
---

Visually verify that markdown elements render with proper dark mode typography styling using prose-invert class

## Details

Toggle the application to dark mode (either via system preference or application toggle if available) and verify the same markdown content. The dark:prose-invert class should automatically invert colors for readability: text should be light on dark backgrounds, headings should use gray-100, paragraphs gray-300, code blocks gray-950 background, and borders should be appropriately darkened.
