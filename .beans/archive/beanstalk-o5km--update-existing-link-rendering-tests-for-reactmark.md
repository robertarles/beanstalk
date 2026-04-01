---
# beanstalk-o5km
title: Update existing link rendering tests for ReactMarkdown DOM structure
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T14:13:09Z
parent: beanstalk-rgii
---

Modify link rendering tests in BeanDetail.test.tsx (lines 155-186) to work with ReactMarkdown's span-based link output instead of direct text nodes

## Details

Update the test cases in src/test/components/BeanDetail.test.tsx lines 155-186:

1. For valid link rendering tests (lines 155-178):
   - Change queries to find links as span elements with onClick handlers, not direct text nodes
   - Use screen.getByRole or data-testid if needed for targeting
   - Verify className includes 'cursor-pointer' to indicate clickable links
   - Test that onClick handlers are present and functional

2. For the 'does not render non-HTTP scheme links' test (lines 180-186):
   - Verify bad links (javascript:, file:, etc.) render as plain span without cursor-pointer class
   - Check that text content is just the link text, not the full markdown syntax like '[bad](javascript:xss)'
   - Ensure no onClick handler is attached to invalid links

Use Testing Library semantic queries (getByText, getByRole) and verify element types, classes, and event handlers rather than exact DOM structure.

## Summary of Changes\n\nUpdated existing link rendering test in BeanDetail.test.tsx for ReactMarkdown DOM structure.
