---
# beanstalk-cwff
title: Write click interaction and security tests for links
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:58:58Z
parent: beanstalk-gv96
---

Create tests verifying click handlers call mocked openUrl with correct URLs and that non-HTTP links (javascript:, file:) are NOT rendered as clickable

## Details

Extend BeanDetail.test.tsx with interaction tests: (1) render bean with markdown link, use screen.getByText to find link span, fireEvent.click on it, assert mockOpenUrl.toHaveBeenCalledWith('https://example.com'), (2) test with multiple links ensuring each click calls openUrl with the correct respective URL, (3) create security tests for non-HTTP schemes: render bean with '[evil](javascript:alert(1))' body and verify NO clickable span is rendered or click handler exists, (4) same for 'file://' scheme. Use beforeEach to clear mocks with vi.clearAllMocks(). Verify mockOpenUrl is NOT called for non-HTTP links.
