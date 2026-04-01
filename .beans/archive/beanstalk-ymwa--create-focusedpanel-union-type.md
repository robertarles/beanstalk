---
# beanstalk-ymwa
title: Create FocusedPanel union type
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:42Z
parent: beanstalk-dymy
---

Define the FocusedPanel union type as 'sidebar' | 'list' | 'detail' in src/types/keyboard.ts

## Details

Create src/types/keyboard.ts file and define the FocusedPanel type as a TypeScript union type with three string literals: 'sidebar', 'list', and 'detail'. This type will represent which panel currently has keyboard focus in the application.
