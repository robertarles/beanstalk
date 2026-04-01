---
# beanstalk-20jb
title: Implement 'n' key handler for new bean creation
status: completed
type: task
priority: normal
tags:
    - master
    - tm_id:3
created_at: 2026-03-27T16:35:25Z
updated_at: 2026-03-29T14:08:43Z
parent: beanstalk-njt5
---

Add 'n' key binding to open new bean creation form, working even without selected bean

## Details

Register 'n' key in tinykeys:
- Unlike other bean action keys, 'n' should work even when selectedBeanId is null
- Call the existing onNewBean callback from App.tsx:209-212
- Clear current selection (setSelectedBeanId(null)) to ensure clean state for new bean form
- May need to shift focus to the new bean form/modal when it opens

Reuse existing new bean creation infrastructure, just add keyboard trigger.
