---
# beanstalk-p0o2
title: Build keybindings table with categorized shortcuts
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:42Z
parent: beanstalk-c1mf
---

Create organized table displaying all keyboard shortcuts grouped by category (Global, Navigation, Bean Actions, Detail Panel)

## Details

Inside the KeyboardHelp component content panel, create a table or structured layout:
- Group keybindings into sections: Global (j/k, h/l, gg/G, /, Esc, ?), Bean Actions (Enter, i, e, n, s, y), Detail (Ctrl-f/Ctrl-b)
- Display key combination in one column, description in another
- Use semantic HTML (table or definition list) for accessibility
- Style with consistent spacing and typography matching the app's design system
