---
# beanstalk-gv96
title: Write integration tests for BeanDetail link rendering
status: completed
type: epic
priority: normal
tags:
    - master
    - tm_id:9
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T13:00:22Z
parent: beanstalk-rcdr
blocked_by:
    - beanstalk-w0s4
---

Create React Testing Library tests for the clickable link functionality in BeanDetail component

## Details

Create or extend `src/test/components/BeanDetail.test.tsx` with tests that verify:
1. Rendering a bean with a markdown link shows a clickable span with correct styling
2. Clicking the link calls the mocked openUrl function with the correct URL
3. Rendering a bean with plain text shows no clickable links
4. Rendering a bean with multiple links creates multiple clickable spans
5. Non-HTTP links (javascript:, file:) are NOT clickable

Mock the `openUrl` function from `src/lib/tauri.ts` using Vitest's `vi.mock()`. Follow existing test patterns (see BeanList.test.tsx). Use `screen.getByText`, `fireEvent.click`, and `expect(mockOpenUrl).toHaveBeenCalledWith(url)` assertions.
