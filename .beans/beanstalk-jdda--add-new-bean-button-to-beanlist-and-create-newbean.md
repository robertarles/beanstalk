---
# beanstalk-jdda
title: Add New Bean button to BeanList and create NewBeanForm component shell
status: todo
type: task
tags:
    - master
    - tm_id:1
created_at: 2026-03-25T18:05:43Z
updated_at: 2026-03-25T18:05:43Z
parent: beanstalk-rc33
---

Add a New Bean button to the BeanList component toolbar (top or bottom) and create the basic NewBeanForm component structure that will house the form fields

## Details

1. Add a button component to BeanList.tsx toolbar area with appropriate styling (macOS native look)
2. Wire button click to show/hide NewBeanForm
3. Create NewBeanForm.tsx component file
4. Set up basic form structure (can reuse patterns from BeanDetail edit mode)
5. Decide on UX approach: Option A (show in detail pane) or Option B (modal overlay)
6. Add state management for showing/hiding the form
7. Ensure button is accessible and has proper aria labels
