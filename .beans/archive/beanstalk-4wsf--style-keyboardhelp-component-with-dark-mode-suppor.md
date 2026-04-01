---
# beanstalk-4wsf
title: Style KeyboardHelp component with dark mode support
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-c1mf
---

Apply consistent styling to KeyboardHelp component matching existing UI theme and dark mode support

## Details

Apply Tailwind classes or styled components to match project styling:
- Use existing dark mode patterns (dark:bg-gray-800, dark:text-gray-100, etc.)
- Style backdrop with appropriate opacity
- Style content panel with border, shadow, padding, and rounded corners
- Style table/list with proper contrast and readability
- Ensure keybinding badges/chips are visually distinct (e.g., kbd-style elements)
- Reference existing component styles for consistency (BeanDetail.tsx, AddProjectDialog.tsx)
