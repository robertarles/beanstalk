---
# beanstalk-ku3e
title: Create renderBody function with segment mapping
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T12:51:34Z
updated_at: 2026-03-27T12:58:54Z
parent: beanstalk-w0s4
---

Implement the renderBody(body: string) function in BeanDetail.tsx that imports parseBodyWithLinks and openUrl, then maps body segments to React elements with proper key props

## Details

In BeanDetail.tsx, add imports for parseBodyWithLinks from the parser utility and openUrl from src/lib/tauri.ts. Create the renderBody function that: 1) Calls parseBodyWithLinks(body) to get segments array, 2) Maps each segment to a React element - text segments become <span key={index}>{segment.content}</span>, link segments become <span key={index} className="text-blue-500 underline cursor-pointer hover:text-blue-600" onClick={() => openUrl(segment.url).catch(console.error)}>{segment.text}</span>. Use segment index as key for React list rendering.
