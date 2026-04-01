---
# beanstalk-tc8p
title: Verify prose-invert class handles base dark mode styling
status: scrapped
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-30T13:57:15Z
updated_at: 2026-03-30T14:08:14Z
parent: beanstalk-5v9t
---

Review current BeanDetail.tsx implementation to confirm prose-invert class is applied to ReactMarkdown wrapper and verify which markdown elements it automatically handles

## Details

Check BeanDetail.tsx to ensure the ReactMarkdown component has the prose-invert class in its className prop. Document which elements (headers, paragraphs, lists, blockquotes, horizontal rules, links) are automatically styled by prose-invert in dark mode. Create a test markdown document with all element types to visually verify the baseline dark mode styling.
