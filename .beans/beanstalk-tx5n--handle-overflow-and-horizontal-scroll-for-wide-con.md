---
# beanstalk-tx5n
title: Handle overflow and horizontal scroll for wide content
status: completed
type: epic
priority: normal
tags:
    - master
    - tm_id:9
created_at: 2026-03-30T13:57:15Z
updated_at: 2026-03-30T15:33:37Z
parent: beanstalk-64n0
blocked_by:
    - beanstalk-uyj4
    - beanstalk-agdz
---

Ensure tables and wide code blocks scroll horizontally without breaking layout

## Details

Verify and fix overflow handling for wide markdown content:

1. Code blocks: Already have `overflow-x-auto` in pre override - verify this works
2. Tables: May need additional wrapper or class:
   ```tsx
   table: ({children}) => (
     <div className="overflow-x-auto">
       <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
         {children}
       </table>
     </div>
   )
   ```
3. Ensure ReactMarkdown wrapper has `max-w-none` (already present in prose class)
4. Test with very wide tables (many columns) and long code lines
5. Verify parent container (.flex-1 div wrapping body) doesn't prevent scrolling

The goal: wide content should scroll horizontally within the body section without affecting the overall BeanDetail layout or causing horizontal scroll at the app level.

## Summary of Changes\n\nOverflow and horizontal scroll handled via table renderer wrapper and pre renderer overflow-x-auto.
