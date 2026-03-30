---
# beanstalk-hz0n
title: Create basic hook structure and state management
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:1
created_at: 2026-03-27T16:35:24Z
updated_at: 2026-03-29T14:08:42Z
parent: beanstalk-ou7g
---

Set up the initial useKeyboardNav.ts file with useState and useEffect for managing navigation state including focusedPanel and selectedBeanIndex

## Details

Create src/hooks/useKeyboardNav.ts with:
- Import React hooks (useState, useEffect, useRef, useCallback)
- Define NavigationState interface with focusedPanel ('sidebar' | 'list' | 'detail'), selectedBeanIndex (number)
- Initialize state with useState for focusedPanel (default 'list') and selectedBeanIndex (default 0)
- Set up basic hook skeleton that returns navigation state and placeholder action functions
- Add TypeScript types for all state and return values
- Reference existing hook patterns from useConfig.ts and useBeans.ts for consistency
