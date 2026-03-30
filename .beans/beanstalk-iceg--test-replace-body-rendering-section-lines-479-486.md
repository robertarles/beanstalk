---
# beanstalk-iceg
title: 'Test: Replace body rendering section (lines 479-486) with ReactMarkdown component'
status: todo
type: task
tags:
    - tm_id:3.testStrategy
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T13:57:14Z
parent: beanstalk-h23q
blocked_by:
    - beanstalk-m0u0
---

Manual verification: View beans with various markdown (headers, bold, inline code, code blocks, links, checkboxes). Verify links are clickable spans (not <a> tags), code styling matches existing design, and GFM features render correctly. Run `npm run build` to confirm TypeScript compilation. Run `npm test` - expect some BeanDetail tests to fail (will be fixed in task 6).
