---
# beanstalk-h23q
title: Implement ReactMarkdown component with custom renderers
status: completed
type: epic
priority: high
tags:
    - master
    - tm_id:4
created_at: 2026-03-30T13:57:14Z
updated_at: 2026-03-30T14:13:05Z
parent: beanstalk-64n0
---

Replace renderBody function and pre tag with ReactMarkdown component in BeanDetail.tsx

## Details

In src/components/BeanDetail.tsx:
1. Import ReactMarkdown from 'react-markdown', remarkGfm from 'remark-gfm', and isAllowedUrl from '../lib/markdown'
2. Remove the parseBodyWithLinks import (no longer needed)
3. Remove the renderBody function (lines 333-352)
4. Replace the body rendering section (lines 479-486) with:
   ```tsx
   {bean.body ? (
     <ReactMarkdown
       remarkPlugins={[remarkGfm]}
       components={{
         a: ({href, children}) => (
           href && isAllowedUrl(href) ? (
             <span
               className="text-blue-500 underline cursor-pointer hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:text-blue-700 transition-colors"
               onClick={() => openUrl(href).catch(console.error)}
             >
               {children}
             </span>
           ) : (
             <span>{children}</span>
           )
         ),
         code: ({className, children}) => (
           <code className={`${className || ''} px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-gray-800 dark:text-gray-200`}>
             {children}
           </code>
         ),
         pre: ({children}) => (
           <pre className="p-3 rounded bg-gray-900 dark:bg-gray-950 overflow-x-auto [&>code]:bg-transparent">
             {children}
           </pre>
         ),
         input: (props) => <input {...props} readOnly />,
       }}
       className="prose prose-sm dark:prose-invert max-w-none"
     >
       {bean.body}
     </ReactMarkdown>
   ) : (
     <span className="text-sm text-gray-400 dark:text-gray-600 italic">No description</span>
   )}
   ```

Key implementation notes:
- Link renderer never outputs <a> tags, only <span> elements with onClick handlers
- isAllowedUrl validation prevents non-HTTP schemes from becoming clickable
- Code renderer handles inline code with pill styling
- Pre renderer wraps code blocks with dark background and horizontal scroll
- Input renderer adds readOnly to suppress React warnings for GFM checkboxes

## Summary of Changes\n\nImplemented ReactMarkdown component with custom renderers in BeanDetail.tsx replacing the old renderBody function.
