---
# beanstalk-qncd
title: Set up openUrl mock and create link rendering tests
status: todo
type: task
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:51:34Z
parent: beanstalk-gv96
---

Add mock for openUrl function and create tests verifying markdown links render as clickable spans with correct styling, and plain text renders without clickable links

## Details

Update src/test/setup.ts to add global mock for @tauri-apps/plugin-opener (similar to existing @tauri-apps/api/core mock). In BeanDetail.test.tsx, create test cases: (1) verify bean with markdown link like '[Example](https://example.com)' renders a clickable span with text 'Example' and link styling classes, (2) verify bean with plain text body shows no clickable link elements, (3) verify bean with multiple markdown links '[A](https://a.com) and [B](https://b.com)' creates multiple clickable spans. Use vi.mock('@tauri-apps/plugin-opener') with { openUrl: vi.fn() } and import the mock to verify calls.
