---
# beanstalk-m0u0
title: Replace body rendering section (lines 479-486) with ReactMarkdown component
status: todo
type: task
tags:
    - master
    - tm_id:3
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T13:57:14Z
parent: beanstalk-h23q
---

Implement the complete ReactMarkdown component with custom renderers for links, code, pre blocks, and checkboxes, replacing the existing body display logic.

## Details

In src/components/BeanDetail.tsx, replace the body rendering section (lines 479-486) with the ReactMarkdown component including:

1. remarkPlugins={[remarkGfm]} for GFM support
2. Custom 'a' renderer: Returns <span> (never <a>), uses isAllowedUrl validation, preserves onClick with openUrl, maintains existing styling (text-blue-500, underline, hover effects)
3. Custom 'code' renderer: Inline code with px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800
4. Custom 'pre' renderer: Code blocks with p-3 rounded bg-gray-900 dark:bg-gray-950 overflow-x-auto, transparent child code background
5. Custom 'input' renderer: Adds readOnly prop for GFM checkboxes to suppress React warnings
6. className="prose prose-sm dark:prose-invert max-w-none"
7. Fallback for empty body: italic gray text "No description"

Critical: Link renderer must never output <a> tags for security. All styling must match existing patterns.
