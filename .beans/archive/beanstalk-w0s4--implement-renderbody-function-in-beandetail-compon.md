---
# beanstalk-w0s4
title: Implement renderBody function in BeanDetail component
status: completed
type: epic
priority: high
tags:
    - master
    - tm_id:6
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:59:47Z
parent: beanstalk-rcdr
blocked_by:
    - beanstalk-nhoe
    - beanstalk-7yu7
---

Replace the plain text body rendering with a React component that renders parsed markdown links as clickable spans

## Details

In BeanDetail.tsx, create a `renderBody(body: string)` function that uses the parser from task 5 to split the body into segments, then maps each segment to React elements. Text segments render as plain `<span>` elements with `whitespace-pre-wrap`. Link segments render as styled `<span>` elements with:
- className: `text-blue-500 underline cursor-pointer hover:text-blue-600`
- onClick handler that calls `openUrl(segment.url).catch(console.error)`
- Key prop for React list rendering

Replace the current body `<pre>` block (lines 430-436) with a `<div>` or `<pre>` containing `{renderBody(bean.body)}`. Preserve the monospace font and whitespace styling on the container. Example:
```tsx
<pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
  {renderBody(bean.body)}
</pre>
```
