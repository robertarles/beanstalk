---
# beanstalk-aciu
title: Replace body rendering block with renderBody call
status: todo
type: task
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:34Z
parent: beanstalk-w0s4
---

Update the existing body rendering section (lines 429-436) to use the new renderBody function while preserving monospace font and whitespace styling

## Details

Locate the current body rendering block in BeanDetail.tsx around lines 429-436 (the <pre> block with className containing whitespace-pre-wrap font-mono). Replace the direct {bean.body} text content with {renderBody(bean.body)}. Keep the existing container element (<pre> or <div>) with its current styling classes: whitespace-pre-wrap font-mono text-sm text-gray-700 dark:text-gray-300 leading-relaxed. The container provides the monospace styling while renderBody handles the individual segment rendering with clickable links.
