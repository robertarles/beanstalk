---
# beanstalk-dffk
title: Implement all form input fields with proper types and defaults
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:2
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T19:48:11Z
parent: beanstalk-rc33
---

Build out the complete form with all required and optional fields: title (required text), status (dropdown), tags (tag input), assignee (text), and body (textarea)

## Details

1. Add title input field (text input, required, autofocus on form open)
2. Add status dropdown populated from .beans.yml config, default to 'open' or first status
3. Add tags input component (either multi-select or comma-separated text input)
4. Add assignee text input (optional)
5. Add body textarea with markdown support preview (optional)
6. Set up form state management using React hooks (useState or useForm)
7. Apply consistent styling matching BeanDetail edit mode
8. Ensure proper tab order for keyboard navigation
