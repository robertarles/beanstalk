---
# beanstalk-5xpx
title: Add smoke tests for markdown elements rendered by ReactMarkdown
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T15:34:01Z
parent: beanstalk-rgii
---

Create new test cases in BeanDetail.test.tsx covering headers, bold text, inline code, code blocks, lists, tables, and GFM task list checkboxes

## Details

Add smoke tests to src/test/components/BeanDetail.test.tsx using semantic queries:

1. Heading: Test '## Heading' renders as <h2> element using screen.getByRole('heading', { level: 2 })
2. Bold: Test '**bold**' renders with <strong> tag using screen.getByText with matcher
3. Inline code: Test '`code`' renders with <code> element and appropriate classes (background pill styling)
4. Code block: Test triple backtick fenced blocks render within <pre><code> structure with dark background class
5. Lists: Test list items render as <li> within <ul> or <ol> using getByRole('list') and getByRole('listitem')
6. GFM tables: Test table markdown renders with proper <table>, <thead>, <tbody>, <tr>, <td> structure
7. GFM task lists: Test '- [ ]' and '- [x]' render as <input type="checkbox" readOnly> elements

Use screen.getByRole, getByText, and queryByRole for semantic queries. Verify element types and CSS classes without asserting exact DOM hierarchy.

## Summary of Changes\n\nAdded smoke tests for markdown elements: heading, bold, italic, code, lists, blockquote, hr, table, task list, strikethrough, mixed content.
