---
# beanstalk-5v9t
title: Add dark mode styles for all markdown elements
status: completed
type: epic
priority: normal
tags:
    - master
    - tm_id:8
created_at: 2026-03-30T13:57:15Z
updated_at: 2026-03-30T15:33:37Z
parent: beanstalk-64n0
blocked_by:
    - beanstalk-agdz
---

Ensure all markdown elements have proper dark mode styling via Tailwind classes

## Details

Review and verify dark mode styling for all markdown elements rendered by ReactMarkdown:

1. Headers (h1-h3): Should use dark:text-gray-100
2. Paragraphs: Should use dark:text-gray-300
3. Inline code: Should have dark:bg-gray-800 and dark:text-gray-200 (already in component overrides)
4. Code blocks: Should have dark:bg-gray-950 (already in pre override)
5. Links: Should have dark:hover:bg-blue-900/20 (already implemented)
6. Tables: Add dark:border-gray-700 for borders via prose-invert or custom CSS
7. Blockquotes: Should have dark:border-gray-700 for left border via prose-invert
8. Horizontal rules: Should have dark:border-gray-800 via prose-invert
9. Lists: Should have dark:text-gray-300 for list items via prose-invert

The `prose-invert` class handles most dark mode styling automatically. Add custom overrides in index.css if specific elements need adjustment:
```css
@media (prefers-color-scheme: dark) {
  .prose table { @apply border-gray-700; }
  .prose th, .prose td { @apply border-gray-700; }
}
```

## Summary of Changes\n\nDark mode styles handled via Tailwind dark: classes on all custom renderers.
