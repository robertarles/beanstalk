---
# beanstalk-uyj4
title: Perform manual acceptance criteria verification
status: todo
type: task
priority: normal
tags:
    - master
    - tm_id:4
created_at: 2026-03-30T13:57:15Z
updated_at: 2026-03-30T13:57:15Z
parent: beanstalk-j8qt
blocked_by:
    - beanstalk-wc89
---

Manually test all 9 acceptance criteria from the PRD by interacting with rendered beans in the UI

## Details

Start the development server and manually verify each acceptance criterion from the PRD:
1. Bean with `## Heading` renders as <h2> element (inspect DOM)
2. `**bold**` renders as bold text
3. `` `inline code` `` renders as monospace pill with background
4. Fenced code blocks render with dark background and horizontal scroll
5. `[link](https://example.com)` renders as blue clickable text, opens in browser when clicked
6. `[bad](javascript:alert(1))` renders as plain text, not clickable (XSS protection)
7. GFM tables render with borders and proper formatting
8. GFM task list `- [ ]` and `- [x]` render with checkboxes
9. All elements look correct in dark mode (toggle dark mode and re-verify all above)

Use existing test beans or create temporary test beans with comprehensive markdown examples. Take screenshots if needed. Document any issues found.
