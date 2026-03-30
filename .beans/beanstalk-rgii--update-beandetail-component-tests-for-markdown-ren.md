---
# beanstalk-rgii
title: Update BeanDetail component tests for markdown rendering
status: todo
type: epic
priority: high
tags:
    - master
    - tm_id:6
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T13:57:16Z
parent: beanstalk-64n0
blocked_by:
    - beanstalk-uyj4
---

Modify BeanDetail.test.tsx to work with ReactMarkdown instead of parseBodyWithLinks

## Details

In src/test/components/BeanDetail.test.tsx:
1. Update link rendering tests (lines 155-178) to work with ReactMarkdown's DOM output:
   - Links are now rendered as <span> with onClick handlers (not direct text nodes)
   - Use screen.getByRole or data-testid attributes if needed
   - Verify className includes 'cursor-pointer' for valid links
2. Update the "does not render non-HTTP scheme links" test (lines 180-186):
   - Bad links should render as plain <span> without cursor-pointer class
   - Text content should just be the link text, not the full markdown syntax
3. Add new smoke tests for markdown elements:
   - Heading renders as <h2>
   - Bold text renders with <strong>
   - Inline code renders with <code> and appropriate classes
   - Code block renders within <pre><code>
   - List items render as <li> within <ul> or <ol>
   - GFM table renders with <table>, <thead>, <tbody>, <tr>, <td>
   - GFM task list checkbox renders as <input type="checkbox" readOnly>

Key testing approach: Use semantic queries (getByRole, getByText) and verify element types and classes rather than exact DOM structure.
