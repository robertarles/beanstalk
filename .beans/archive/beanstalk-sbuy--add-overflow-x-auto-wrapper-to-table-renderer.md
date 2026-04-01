---
# beanstalk-sbuy
title: Add overflow-x-auto wrapper to table renderer
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-30T13:57:15Z
updated_at: 2026-03-30T15:33:30Z
parent: beanstalk-tx5n
---

Wrap the table element in a div with overflow-x-auto class to enable horizontal scrolling for wide tables

## Details

Modify the ReactMarkdown components prop in BeanDetail.tsx to add a table renderer. The table renderer should wrap the table element in a div with className='overflow-x-auto'. The table itself should have className='min-w-full border-collapse border border-gray-200 dark:border-gray-700'. Implementation: ```tsx
table: ({children}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
      {children}
    </table>
  </div>
)
```
This ensures tables with many columns scroll horizontally without breaking the layout.

## Summary of Changes\n\nAdded table renderer with overflow-x-auto wrapper div in BeanDetail.tsx ReactMarkdown components.
