---
# beanstalk-alub
title: Add loading states and empty states with helpful messages
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:5
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T19:58:28Z
parent: beanstalk-d6mi
blocked_by:
    - beanstalk-wizg
---

Implement spinners, skeleton loaders for bean list, and empty states for no projects, no beans, and no search results

## Details

1. Add loading state to useBeans hook:
   - isLoading: boolean (true while fetching beans)
   - Show spinner or skeleton loader in BeanList while isLoading=true
2. Implement skeleton loaders:
   - Create SkeletonBeanItem component (gray rectangles mimicking bean list items)
   - Show 5-10 skeleton items while loading
3. Add loading indicators for create/update operations:
   - isSaving: boolean in NewBeanForm and BeanDetail edit mode
   - Show spinner on Save button while isSaving=true, disable button
4. Implement empty states:
   - No projects: Large centered message "Add a project to get started" with big "Add Project" button
   - No beans in project: "No beans found. Create your first bean!" with "New Bean" button
   - No search results: "No beans match your search" with suggestion to clear search or adjust filters
5. Style empty states with friendly, helpful messaging and clear call-to-action buttons
